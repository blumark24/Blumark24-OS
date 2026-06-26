import type { Metadata } from "next";
import MarketingLanding from "@/components/landing/MarketingLanding";
import BlumarkLandingFooter from "@/components/landing/BlumarkLandingFooter";

// `/` is a public marketing surface. It must remain renderable without any
// AuthContext / PermissionsContext / Supabase / Dashboard dependency so that
// the homepage is fast and resilient to backend or auth problems. Auth gating
// for `/dashboard` and other internal routes is handled by middleware.ts and
// the per-route guards.

const landingRelease = "2026-06-26-enterprise-ops-copy-v2";

const heroCopyPatch = String.raw`
(function () {
  var nextTitle = "منصة تشغيل ذكية";
  var nextAccent = "لإدارة الأعمال";
  var nextSubtitle = "Blumark24 OS منصة أعمال موحّدة تجمع العملاء، الموظفين، المهام، التقارير، المكتب الافتراضي، والمساعد الذكي في تجربة تشغيل واحدة — لتمكين المنشآت من تنظيم عملياتها، رفع كفاءة الأداء، واتخاذ قرارات أسرع بثقة أعلى.";
  var nextTrust = ["إعداد سريع", "دعم عربي كامل", "جاهز للتوسع"];

  function applyHeroCopy() {
    var root = document.querySelector(".marketing-landing-root");
    if (!root) return;

    var hero = root.querySelector("#home");
    if (!hero) return;

    var title = hero.querySelector("h1");
    if (title) {
      if (title.childNodes[0] && title.childNodes[0].nodeType === 3) {
        title.childNodes[0].nodeValue = nextTitle + " ";
      }

      var accent = title.querySelector("span.bg-gradient-to-l");
      if (accent && accent.textContent !== nextAccent) {
        accent.textContent = nextAccent;
      }
    }

    var subtitle = hero.querySelector("h1 + p");
    if (subtitle && subtitle.textContent !== nextSubtitle) {
      subtitle.textContent = nextSubtitle;
    }

    var trustItems = hero.querySelectorAll("div.mt-5 span.flex.items-center.gap-1\\.5");
    if (trustItems.length >= 3) {
      nextTrust.forEach(function (item, index) {
        var target = trustItems[index];
        if (!target) return;
        var textNode = Array.prototype.find.call(target.childNodes, function (node) {
          return node.nodeType === 3 && node.nodeValue.trim().length > 0;
        });
        if (textNode && textNode.nodeValue.trim() !== item) {
          textNode.nodeValue = " " + item;
        }
      });
    }
  }

  function startHeroCopyPatch() {
    applyHeroCopy();
    var root = document.querySelector(".marketing-landing-root");
    if (!root || window.__blumarkHeroCopyObserver) return;
    window.__blumarkHeroCopyObserver = new MutationObserver(applyHeroCopy);
    window.__blumarkHeroCopyObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startHeroCopyPatch);
  } else {
    startHeroCopyPatch();
  }

  window.setTimeout(startHeroCopyPatch, 250);
  window.setTimeout(startHeroCopyPatch, 750);
})();
`;

export const metadata: Metadata = {
  title: "Blumark24 OS | منصة تشغيل ذكية لإدارة الأعمال",
  description:
    "منصة أعمال موحّدة تجمع العملاء، الموظفين، المهام، التقارير، المكتب الافتراضي، والمساعد الذكي في تجربة تشغيل واحدة تساعد المنشآت على تنظيم العمليات ورفع كفاءة الأداء.",
  keywords: [
    "Blumark24",
    "Blumark24 OS",
    "منصة تشغيل ذكية",
    "منصة إدارة الأعمال",
    "نظام تشغيل الأعمال",
    "إدارة العملاء",
    "إدارة الموظفين",
    "إدارة المهام",
    "التقارير التشغيلية",
    "المكتب الافتراضي",
    "المساعد الذكي",
    "AI business OS",
    "Business operating system",
    "Virtual Office",
    "CRM",
  ],
  openGraph: {
    title: "Blumark24 OS | Smart Business Operating Platform",
    description:
      "A unified business operating platform for clients, employees, tasks, reports, virtual office, and AI assistance.",
    siteName: "Blumark24 OS",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blumark24 OS | Smart Business Operating Platform",
    description:
      "A unified business operating platform for clients, employees, tasks, reports, virtual office, and AI assistance.",
  },
};

export default function HomePage() {
  return (
    <>
      <div className="landing-footer-upgrade" data-release={landingRelease}>
        <MarketingLanding />
      </div>
      <BlumarkLandingFooter />
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".landing-footer-upgrade .marketing-landing-root > footer { display: none; }",
        }}
      />
      <script
        id="blumark-os-hero-copy-patch"
        dangerouslySetInnerHTML={{ __html: heroCopyPatch }}
      />
    </>
  );
}
