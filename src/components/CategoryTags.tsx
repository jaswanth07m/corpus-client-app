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
  editable?: boolean;
  onCategoryIdsChange?: (categoryIds: string[]) => void;
}

const CategoryTags: React.FC<CategoryTagsProps> = ({
  categoryIds,
  token,
  editable = false,
  onCategoryIdsChange,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shouldFetch = editable || categoryIds.length > 0;
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      setLoading(true);
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

          setCategories(publishedCategories);
        } else {
          console.error('Failed to fetch categories for tags');
        }
      } catch (error) {
        console.error('Categories Error:', error);
      }
      setLoading(false);
    };

    fetchCategories();
  }, [categoryIds.length, editable, token]);

  const selectedCategories = categories.filter((cat) =>
    categoryIds.includes(cat.id),
  );
  const availableCategories = categories.filter(
    (cat) => !categoryIds.includes(cat.id),
  );

  if (loading) {
    return null;
  }

  if (editable) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 min-h-10 max-h-32 overflow-y-auto p-1">
          {selectedCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-500 max-w-xs truncate"
            >
              <span className="mr-2 truncate max-w-[100px] sm:max-w-[150px]">
                {category.title}
              </span>
              <button
                type="button"
                onClick={() =>
                  onCategoryIdsChange?.(
                    categoryIds.filter((id) => id !== category.id),
                  )
                }
                className="text-emerald-800 hover:text-emerald-900 focus:outline-none flex-shrink-0"
                aria-label={`Remove ${category.title}`}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
          {availableCategories.map((category) => (
            <div
              key={category.id}
              onClick={() =>
                onCategoryIdsChange?.([...categoryIds, category.id])
              }
              className="cursor-pointer px-3 py-1.5 rounded-full border transition-all duration-200 text-sm max-w-xs truncate bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            >
              {category.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedCategories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedCategories.map((category) => (
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
