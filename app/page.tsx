import Link from "next/link";
import { LayoutDashboard, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function IndexPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#dcecff] px-4 py-8">
      <Card className="w-full max-w-md border-white/80 bg-white/90 shadow-xl shadow-blue-300/30">
        <CardHeader>
          <CardTitle className="text-2xl">HLLC Store</CardTitle>
          <CardDescription>Choose where you want to go.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button asChild className="h-12 rounded-2xl bg-blue-600">
            <Link href="/home">
              <Store className="size-5" />
              Home
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-2xl"
            variant="secondary"
          >
            <Link href="/admin">
              <LayoutDashboard className="size-5" />
              Admin
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
