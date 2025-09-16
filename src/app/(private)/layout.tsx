import NavLink from "@/components/NavLink";
import { UserButton } from "@clerk/nextjs";
import { CalendarRange } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

const PrivateLayout: React.FC<Props> = ({ children }: Props) => {
  return (
    <>
      <header className="flex py-2 border-b bg-card">
        <nav className="font-medium flex items-center text-sm gap-6 container">
          <div className="flex items-center gap-2 font-semibold mr-auto">
            <CalendarRange className="size-6" />
            <span className="sr-only md:not-sr-only">Calendar</span>
          </div>
          <NavLink href="/events">Events</NavLink>
          <NavLink href="/schedule">Schedule</NavLink>
          <div>
            <UserButton
              appearance={{ elements: { userButtonAvatarBox: "size-full" } }}
            />
          </div>
        </nav>
      </header>
      <main className="container my-6">{children}</main>
    </>
  );
};

export default PrivateLayout;
