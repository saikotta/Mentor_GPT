import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Brain } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 noise grid place-items-center px-4 py-10">
      <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-slate-200 bg-white shadow-2xl">
        <CardContent className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-blue-900 text-white shadow-xl shadow-blue-900/20">
              <Brain className="h-10 w-10" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                <h1 className="text-3xl font-black tracking-tight text-slate-900" data-testid="text-404-title">
                  404 Error
                </h1>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed" data-testid="text-404-body">
                The page you're looking for doesn't exist yet. Let's get you back on track to your learning journey.
              </p>
            </div>

            <Button asChild size="lg" className="w-full rounded-2xl bg-blue-900 py-6 text-lg font-bold hover:bg-blue-800 shadow-lg shadow-blue-900/20" data-testid="link-404-onboarding">
              <Link href="/onboarding" className="flex items-center justify-center gap-2">
                Go to onboarding
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" asChild className="text-slate-500 hover:text-blue-900 font-bold">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
