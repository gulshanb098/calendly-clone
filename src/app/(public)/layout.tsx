interface Props {
  children: React.ReactNode;
}

const PublicLayout: React.FC<Props> = ({ children }: Props) => {
  return <main className="container my-6">{children}</main>;
};

export default PublicLayout;
