# Contributing to Corpus Frontend

Thank you for your interest in contributing to the Corpus Frontend project! This document provides guidelines and information for contributors.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

### Local Development Setup

1. **Fork and Clone the Repository**

   ```bash
   git clone https://github.com/your-username/corpus-frontend.git
   cd corpus-frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:5173` to view the application.

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📁 Project Structure

```
corpus-frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components (shadcn/ui)
│   │   └── ...            # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and constants
│   ├── pages/             # Page components
│   ├── App.tsx            # Main app component
│   └── main.tsx           # App entry point
├── tailwind.config.ts     # Tailwind CSS configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies and scripts
```

## 🎨 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Query (TanStack Query)
- **Notifications**: Sonner
- **Code Quality**: ESLint, TypeScript

## 📝 Development Guidelines

### Code Style

1. **TypeScript**: Use TypeScript for all new code
2. **Components**: Use functional components with hooks
3. **Naming**: Use PascalCase for components, camelCase for functions/variables
4. **Imports**: Use absolute imports with `@/` prefix

### Component Guidelines

1. **File Structure**: One component per file
2. **Props Interface**: Define props interface for each component
3. **Default Props**: Use default parameters instead of defaultProps
4. **Error Boundaries**: Wrap components that might fail

### Example Component Structure

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {onAction && <Button onClick={onAction}>Action</Button>}
    </div>
  );
};

export default MyComponent;
```

### Styling Guidelines

1. **Tailwind CSS**: Use Tailwind utility classes
2. **Responsive Design**: Use Tailwind's responsive prefixes
3. **Custom CSS**: Avoid custom CSS unless necessary
4. **Dark Mode**: Support dark mode using `next-themes`

### State Management

1. **Local State**: Use `useState` for component-local state
2. **Server State**: Use React Query for API calls
3. **Global State**: Use React Context for shared state
4. **Form State**: Use React Hook Form

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Add TypeScript types
- Include proper error handling
- Add comments for complex logic

### 3. Test Your Changes

- Test on different screen sizes
- Test with different browsers
- Ensure accessibility standards are met
- Check for TypeScript errors

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

## 📋 Pull Request Guidelines

### Before Submitting

1. **Code Review**: Review your own code
2. **Testing**: Test all functionality
3. **Linting**: Run `npm run lint` and fix any issues
4. **Build**: Ensure `npm run build` succeeds

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Tested in different browsers

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No console errors
- [ ] TypeScript types are correct
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, device
6. **Screenshots**: Visual evidence if applicable

## 💡 Feature Requests

When requesting features, please include:

1. **Description**: Clear description of the feature
2. **Use Case**: Why this feature is needed
3. **Mockups**: Visual examples if applicable
4. **Alternatives**: Any existing workarounds

## 🎯 Current Focus Areas

### High Priority

- [ ] Improve accessibility
- [ ] Add comprehensive error handling
- [ ] Optimize performance
- [ ] Add unit tests

### Medium Priority

- [ ] Add dark mode support
- [ ] Improve mobile experience
- [ ] Add loading states
- [ ] Enhance form validation

### Low Priority

- [ ] Add animations
- [ ] Improve documentation
- [ ] Add more UI components

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow project conventions

### Communication

- Use clear, descriptive commit messages
- Provide context in pull requests
- Ask questions when unsure
- Share knowledge with the community

## 📚 Resources

### Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

### Tools

- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [React Query Documentation](https://tanstack.com/query)

## 🆘 Getting Help

If you need help:

1. **Check Documentation**: Review this file and project README
2. **Search Issues**: Look for similar issues in Gitlab
3. **Ask Questions**: Create an issue with the "question" label
4. **Join Discussions**: Participate in project discussions

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Corpus Frontend! 🎉
