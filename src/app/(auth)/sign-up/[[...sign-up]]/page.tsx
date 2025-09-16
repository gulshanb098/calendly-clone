import { SignUp } from "@clerk/nextjs";

const Page: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignUp />
    </div>
  );
};

export default Page;
