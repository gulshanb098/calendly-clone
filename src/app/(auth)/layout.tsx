import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

const AuthLayout: React.FC<Props> = async ({ children }: Props) => {
  const { userId } = await auth();
  if (userId !== null) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center">
      {children}
    </div>
  );
};

export default AuthLayout;
