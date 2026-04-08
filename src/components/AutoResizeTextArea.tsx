import { useEffect, useRef } from 'react';

interface AutoResizeTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  minHeight?: string;
}

export function AutoResizeTextArea({
  value,
  onChange,
  className = '',
  disabled,
  placeholder,
  minHeight,
  ...props
}: AutoResizeTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = minHeight
        ? Math.max(textarea.scrollHeight, parseInt(minHeight))
        : textarea.scrollHeight;
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, minHeight]);

  return (
    <textarea
      ref={textareaRef}
      className={`w-full resize-none border border-gray-300 dark:border-gray-600 p-2.5 rounded bg-gray-50 dark:bg-gray-800 ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      style={{ height: 'auto', minHeight, overflow: 'hidden' }}
      {...props}
    />
  );
}
