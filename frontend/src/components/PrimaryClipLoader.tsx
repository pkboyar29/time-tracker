import { FC } from 'react';
import { ClipLoader } from 'react-spinners';
import { colors } from '../../design-tokens';

interface PrimaryClipLoaderProps {
  size?: string;
}

const PrimaryClipLoader: FC<PrimaryClipLoaderProps> = ({ size }) => {
  return <ClipLoader size={size} color={colors.primary} />;
};

export default PrimaryClipLoader;
