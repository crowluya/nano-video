import { Aside } from "@/components/mdx/Aside";
import { Callout } from "@/components/mdx/Callout";
import CodeBlock from "@/components/mdx/CodeBlock";
import { MdxCard } from "@/components/mdx/MdxCard";
import React, { ReactNode } from "react";

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className: string;
  children: ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ level, className, children }) => {
  const HeadingTag = `h${level}` as keyof React.ElementType;
  const headingId = children?.toString() ?? "";

  return React.createElement(
    HeadingTag,
    { id: headingId, className },
    children
  );
};

interface MDXComponentsProps {
  [key: string]: React.FC<any>;
}

const MDXComponents: MDXComponentsProps = {
  h1: (props) => (
    <Heading level={1} className="text-4xl font-bold mt-8 mb-6" {...props} />
  ),
  h2: (props) => (
    <Heading
      level={2}
      className="text-3xl font-semibold mt-8 mb-6 border-b-2 border-gray-200 pb-2"
      {...props}
    />
  ),
  h3: (props) => (
    <Heading
      level={3}
      className="text-2xl font-semibold mt-6 mb-4"
      {...props}
    />
  ),
  h4: (props) => (
    <Heading level={4} className="text-xl font-semibold mt-6 mb-4" {...props} />
  ),
  h5: (props) => (
    <Heading level={5} className="text-lg font-semibold mt-6 mb-4" {...props} />
  ),
  h6: (props) => (
    <Heading
      level={6}
      className="text-base font-semibold mt-6 mb-4"
      {...props}
    />
  ),
  hr: (props) => <hr className="border-t border-gray-200 my-8" {...props} />,
  p: (props) => (
    <p
      className="my-3 leading-relaxed text-gray-700 dark:text-gray-300"
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline underline-offset-4"
      target="_blank"
      {...props}
    />
  ),
  ul: (props) => <ul className="list-disc pl-6 mt-0 mb-6" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 mt-0 mb-6" {...props} />,
  li: (props) => (
    <li className="mb-3 text-gray-700 dark:text-gray-300" {...props} />
  ),
  code: (props) => (
    <span
      className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm"
      {...props}
    />
  ),
  pre: (props) => {
    const preStyles =
      "rounded-lg p-3 overflow-x-auto my-4 bg-gray-100 dark:bg-gray-800";
    return (
      <CodeBlock
        {...props}
        className={`${props.className || ""} ${preStyles}`.trim()}
      />
    );
  },
  blockquote: (props) => (
    <blockquote
      className="pl-6 border-l-4 my-6 text-gray-600 dark:text-gray-400 italic"
      {...props}
    />
  ),
  img: ({ alt, ...props }) => (
    <img
      alt={alt ?? ""}
      className="rounded-lg border-2 border-gray-200 my-6"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-bold" {...props} />,
  table: (props) => (
    <div className="my-3 overflow-x-auto">
      <table
        className="w-full border-collapse table-fixed overflow-hidden m-0"
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: (props) => <tr {...props} />,
  th: (props) => (
    <th
      className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-left font-bold min-w-[1em] box-border relative align-top [[align=center]]:text-center [[align=right]]:text-right"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border border-gray-200 dark:border-gray-700 px-2 py-1.5 min-w-[1em] box-border relative align-top [[align=center]]:text-center [[align=right]]:text-right"
      {...props}
    />
  ),
  Aside,
  Callout,
  Card: MdxCard,
};

export default MDXComponents;
