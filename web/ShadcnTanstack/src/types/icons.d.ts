export {};

declare global {
  interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
    size?: number | string;
  }
}
