import { useEffect, useRef } from 'react';

interface AutoResizeTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function AutoResizeTextArea({
  value,
  onChange,
  className = '',
  disabled,
  placeholder,
  ...props
}: AutoResizeTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={`w-full resize-none border border-gray-300 dark:border-gray-600 p-2.5 rounded bg-gray-50 dark:bg-gray-800 min-h-[40px] ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      style={{ height: 'auto', overflow: 'hidden' }}
      {...props}
    />
  );
}
