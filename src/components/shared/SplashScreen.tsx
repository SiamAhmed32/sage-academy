import Image from "next/image";

/*
 * First-visit brand splash for the public site.
 *
 * - Shown once per browser session, never on /admin, /student or /login.
 * - Pure CSS animation (opacity/transform only) plus a tiny inline script,
 *   so it adds no JavaScript bundle and never blocks the page: the page keeps
 *   loading underneath and the splash fades away as soon as it is ready
 *   (at most ~1.6 s, at least ~0.7 s so the animation reads as intentional).
 */
const SHOW_SCRIPT = `(function(){try{
var el=document.getElementById("sage-splash");if(!el)return;
var p=location.pathname;
if(/^\\/(admin|student|login|signup|reset-password)/.test(p)||sessionStorage.getItem("sage-splash")){return;}
sessionStorage.setItem("sage-splash","1");
el.style.display="flex";document.documentElement.style.overflow="hidden";
var start=Date.now(),done=false;
function hide(){if(done)return;done=true;var wait=Math.max(0,700-(Date.now()-start));
setTimeout(function(){el.classList.add("is-leaving");document.documentElement.style.overflow="";
setTimeout(function(){el.style.display="none";},450);},wait);}
if(document.readyState==="complete")hide();else window.addEventListener("load",hide);
setTimeout(hide,1600);
}catch(e){}})();`;

export function SplashScreen() {
  return (
    <>
      <div id="sage-splash" className="sage-splash" aria-hidden="true" suppressHydrationWarning style={{ display: "none" }}>
        <div className="sage-splash-glow" />
        <div className="sage-splash-inner">
          <div className="sage-splash-logo">
            <Image src="/sage-wordmark.png" alt="" width={1040} height={411} sizes="220px" loading="eager" fetchPriority="high" />
            <span className="sage-splash-sheen" />
          </div>
          <p className="sage-splash-tag">SAGE Academy</p>
          <span className="sage-splash-bar">
            <span />
          </span>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SHOW_SCRIPT }} />
    </>
  );
}
