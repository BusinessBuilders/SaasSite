import { useTranslations } from 'next-intl';
import React from 'react';

export const CenteredFooter = (props: {
  logo: React.ReactNode;
  name: string;
  iconList?: React.ReactNode; // Made optional
  legalLinks?: React.ReactNode; // Made optional
  children: React.ReactNode;
}) => {
  const t = useTranslations('Footer');

  return (
    <div className="flex flex-col items-center text-center">
      {props.logo}

      <ul className="mt-4 flex gap-x-8 text-lg max-sm:flex-col [&_a:hover]:opacity-100 [&_a]:opacity-60">
        {props.children}
      </ul>

      {/* Only render the icon list if it exists */}
      {props.iconList && (
        <ul className="mt-4 flex flex-row gap-x-5 text-muted-foreground [&_svg:hover]:text-primary [&_svg:hover]:opacity-100 [&_svg]:size-5 [&_svg]:fill-current [&_svg]:opacity-60">
          {props.iconList}
        </ul>
      )}

      <div className="mt-6 flex w-full items-center justify-between gap-y-2 border-t pt-3 text-sm text-muted-foreground max-md:flex-col">
        <div>
          {`© Copyright ${new Date().getFullYear()} ${props.name}. `}
          {t.rich('designed_by', {
            author: () => (
              <a
                className="text-blue-500 hover:text-blue-600"
                href="http://business-builder.online"
              >
                Business Builders
              </a>
            ),
          })}
        </div>

        {/* Only render legal links if they exist */}
        {props.legalLinks && (
          <ul className="flex gap-x-4 font-medium [&_a:hover]:opacity-100 [&_a]:opacity-60">
            {props.legalLinks}
          </ul>
        )}
      </div>
    </div>
  );
};
