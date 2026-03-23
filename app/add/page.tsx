import Navbar from "@/components/Navbar";
import AddExpenseForm from "@/components/AddExpenseForm";

export default function AddPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#e5e5e5]">Add Expense</h1>
          <p className="text-sm text-[#a3a3a3] mt-1">Track your spending by adding a new entry.</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <AddExpenseForm />
        </div>
      </main>
    </div>
  );
}
