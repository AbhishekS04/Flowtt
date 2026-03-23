import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#1a1a1a] border border-[#2a2a2a] shadow-none rounded-xl",
            headerTitle: "text-[#e5e5e5]",
            headerSubtitle: "text-[#a3a3a3]",
            formButtonPrimary: "bg-[#6366f1] hover:bg-[#4f52d6] text-white",
            formFieldInput: "bg-[#0f0f0f] border-[#2a2a2a] text-[#e5e5e5]",
            footerActionLink: "text-[#6366f1] hover:text-[#4f52d6]",
          },
        }}
      />
    </div>
  );
}
