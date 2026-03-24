import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#1a1a1a] border border-[#333333] shadow-none rounded-xl",
            headerTitle: "text-white font-semibold",
            headerSubtitle: "text-[#d1d5db]",
            formButtonPrimary: "bg-[#6366f1] hover:bg-[#4f52d6] text-white font-medium",
            formFieldInput: "bg-[#252525] border-[#404040] text-white placeholder-[#808080]",
            formFieldLabel: "text-[#e5e5e5]",
            footerActionLink: "text-[#818cf8] hover:text-white",
            socialButtonsBlockButton: "border-[#404040] bg-[#1a1a1a] hover:bg-[#252525] text-[#e5e5e5]",
            dividerLine: "bg-[#333333]",
            dividerText: "text-[#808080]",
          },
        }}
      />
    </div>
  );
}
