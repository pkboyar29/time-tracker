import { FC } from 'react';
import CrossIcon from '../../icons/CrossIcon';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  searchString: string;
  setSearchString: (value: string) => void;
  compact?: boolean;
  className?: string;
}

const SearchBar: FC<SearchBarProps> = ({
  searchString,
  setSearchString,
  compact = true,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`${
        compact ? 'w-[160px]' : 'w-full'
      } h-[32px] relative ${className}`}
    >
      <input
        value={searchString}
        onChange={(e) => setSearchString(e.target.value)}
        className="w-full pb-1 transition duration-300 bg-transparent border-b border-solid dark:text-textDark border-b-gray-500 focus:border-b-primary"
        type="text"
        placeholder={t('search')}
      />

      {searchString && (
        <button
          className="absolute right-0 z-10 top-[4px]"
          onClick={() => setSearchString('')}
        >
          <CrossIcon />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
