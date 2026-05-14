import { useWindowDimensions } from "react-native";

const MAX_CONTENT_WIDTH = 720;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const hPad = isTablet ? Math.max(24, (width - MAX_CONTENT_WIDTH) / 2) : 20;
  return { width, height, isTablet, hPad };
}
