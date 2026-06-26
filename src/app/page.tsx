import type { Metadata } from "next";
import MarketingLanding from "@/components/landing/MarketingLanding";
import BlumarkLandingFooter from "@/components/landing/BlumarkLandingFooter";

// `/` is a public marketing surface. It must remain renderable without any
// AuthContext / PermissionsContext / Supabase / Dashboard dependency so that
// the homepage is fast and resilient to backend or auth problems. Auth gating
// for `/dashboard` and other internal routes is handled by middleware.ts and
// the per-route guards.

const landingRelease = "2026-06-26-bilingual-landing-copy";

const heroCopyPatch = String.raw`
(function () {
  var copy = {
    ar: {
      title: "منصة تشغيل ذكية",
      accent: "لإدارة الأعمال",
      subtitle: "Blumark24 OS منصة أعمال موحّدة تجمع العملاء، الموظفين، المهام، التقارير، المكتب الافتراضي، والمساعد الذكي في تجربة تشغيل واحدة — لتمكين المنشآت من تنظيم عملياتها، رفع كفاءة الأداء، واتخاذ قرارات أسرع بثقة أعلى.",
      trust: ["إعداد سريع", "دعم عربي كامل", "جاهز للتوسع"]
    },
    en: {
      title: "Smart Operating Platform",
      accent: "for Business Management",
      subtitle: "Blumark24 OS is a unified business platform that brings clients, employees, tasks, reports, the virtual office, and the AI assistant into one operating experience — helping organizations organize operations, improve performance, and make faster decisions with confidence.",
      trust: ["Quick setup", "Full Arabic support", "Ready to scale"]
    }
  };

  function currentLang() {
    var root = document.querySelector(".marketing-landing-root");
    return root && root.getAttribute("dir") === "ltr" ? "en" : "ar";
  }

  function setTextNodeValue(node, value) {
    if (node && node.nodeType === 3 && node.nodeValue !== value) {
      node.nodeValue = value;
    }
  }

  function applyHeroCopy() {
    var hero = document.querySelector(".marketing-landing-root #home");
    if (!hero) return false;

    var lang = currentLang();
    var next = copy[lang];
    var title = hero.querySelector("h1");

    if (title) {
      setTextNodeValue(title.childNodes[0], next.title + " ");
      var accent = title.querySelector("span.bg-gradient-to-l");
      if (accent && accent.textContent !== next.accent) {
        accent.textContent = next.accent;
      }
    }

    var subtitle = hero.querySelector("h1 + p");
    if (subtitle && subtitle.textContent !== next.subtitle) {
      subtitle.textContent = next.subtitle;
    }

    var trustItems = hero.querySelectorAll("div.mt-5 span.flex.items-center.gap-1\\.5");
    if (trustItems.length >= 3) {
      next.trust.forEach(function (item, index) {
        var target = trustItems[index];
        if (!target) return;
        for (var i = 0; i < target.childNodes.length; i += 1) {
          var node = target.childNodes[i];
          if (node.nodeType === 3 && node.nodeValue.trim().length > 0) {
            setTextNodeValue(node, " " + item);
            break;
          }
        }
      });
    }

    return true;
  }

  function start() {
    var root = document.querySelector(".marketing-landing-root");
    applyHeroCopy();
    window.setTimeout(applyHeroCopy, 250);
    window.setTimeout(applyHeroCopy, 750);

    if (root && !window.__blumarkHeroLangObserver) {
      window.__blumarkHeroLangObserver = new MutationObserver(applyHeroCopy);
      window.__blumarkHeroLangObserver.observe(root, {
        attributes: true,
        attributeFilter: ["dir"]
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
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
