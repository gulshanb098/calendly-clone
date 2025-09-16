import { SignIn } from "@clerk/nextjs";

const Page: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn />
    </div>
  );
};

export default Page;
