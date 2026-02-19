import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
  title: string;
  description: string;
  published: boolean;
  rank: number;
  created_at: string;
  updated_at: string;
}

interface CategoryTagsProps {
  categoryIds: string[];
  token: string;
}

const CategoryTags: React.FC<CategoryTagsProps> = ({ categoryIds, token }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/categories/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const publishedCategories = data
            .filter((cat: Category) => cat.published)
            .sort((a: Category, b: Category) => a.rank - b.rank);

          // Filter to only include categories that match the provided IDs
          const matchedCategories = publishedCategories.filter((cat) =>
            categoryIds.includes(cat.id),
          );

          setCategories(matchedCategories);
        } else {
          console.error('Failed to fetch categories for tags');
        }
      } catch (error) {
        console.error('Categories Error:', error);
      }
      setLoading(false);
    };

    if (categoryIds && categoryIds.length > 0) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [categoryIds, token]);

  if (loading || categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <span
          key={category.id}
          className="inline-flex items-center px-3.5 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full hover:bg-blue-100 transition-colors cursor-default"
        >
          {category.title}
        </span>
      ))}
    </div>
  );
};

export default CategoryTags;
