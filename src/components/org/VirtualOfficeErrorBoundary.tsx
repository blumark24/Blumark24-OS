"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ArrowRight, AlertTriangle } from "lucide-react";

interface Props {
  onBack: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Isolates VirtualOfficePreview render errors so they cannot crash
 * the parent SmartOrgBuilder / full /org page.
 */
export default class VirtualOfficeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to console for debugging — no external logging call
    console.error("[VirtualOffice] render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-2xl border border-amber-500/25 p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: "rgba(10,22,40,0.7)" }}
          dir="rtl"
        >
          <AlertTriangle size={32} className="text-amber-400/70" />
          <p className="text-[#8ba3c7] text-sm">
            تعذر تحميل المكتب الافتراضي مؤقتًا
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onBack();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.05] text-[#8ba3c7] hover:text-white hover:bg-white/[0.08] transition-all text-sm min-h-10 touch-manipulation"
          >
            <ArrowRight size={15} />
            الرجوع إلى الهيكل الإداري
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
