import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const didTriggerRef = useRef(false);
  const pullStartYRef = useRef(null);
  const pullingRef = useRef(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const MAX_PULL = 90;
  const TRIGGER_PULL = 55;
  const cordBaseHeight = 80;
  const knobBaseMarginTop = 4;

  const pullStyles = useMemo(() => {
    const clamped = Math.max(0, Math.min(MAX_PULL, pullOffset));
    return {
      cordHeight: cordBaseHeight + clamped,
      knobTranslateY: clamped,
      clamped,
    };
  }, [pullOffset]);

  const handlePullLamp = () => {
    if (didTriggerRef.current) return;
    didTriggerRef.current = true;
    navigate('/login');
    // Fallback: if client-side navigation is blocked for any reason,
    // force a hard navigation to the login route.
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }, 0);
  };

  const resetPull = () => {
    pullingRef.current = false;
    pullStartYRef.current = null;
    setIsPulling(false);
    setPullOffset(0);
  };

  const onCordPointerDown = (e) => {
    // Start a pull gesture. We do NOT navigate on simple click.
    didTriggerRef.current = false;
    pullingRef.current = true;
    pullStartYRef.current = e.clientY;
    setIsPulling(true);
    // Capture the pointer so we keep receiving move/up events.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore (older browsers)
    }
  };

  const onCordPointerMove = (e) => {
    if (!pullingRef.current) return;
    const startY = pullStartYRef.current;
    if (startY == null) return;
    const delta = Math.max(0, e.clientY - startY);
    setPullOffset(Math.min(MAX_PULL, delta));
  };

  const onCordPointerUp = () => {
    const pulledEnough = pullStyles.clamped >= TRIGGER_PULL;
    if (pulledEnough) {
      handlePullLamp();
      return;
    }
    resetPull();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-14">
        <div className="w-full">
          <div className="text-center text-white">
            <div className="text-4xl font-extrabold tracking-wide sm:text-5xl">GrabNGo</div>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Crowd‑Free Canteen System</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
              Pre‑order food, choose a pickup time slot, and collect your meal without standing in long queues.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="group text-center">
                <div className="mx-auto w-40">
                  {/* Cord (pull to login) */}
                  <div
                    className="mx-auto flex flex-col items-center select-none touch-none"
                    onPointerDown={onCordPointerDown}
                    onPointerMove={onCordPointerMove}
                    onPointerUp={onCordPointerUp}
                    onPointerCancel={resetPull}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handlePullLamp();
                      if (e.key === 'Escape') resetPull();
                    }}
                    aria-label="Pull down the lamp cord to open login"
                  >
                    <span
                      className={`block w-0.5 bg-white/30 ${isPulling ? '' : 'transition-[height] duration-200'}`}
                      style={{ height: `${pullStyles.cordHeight}px` }}
                    />
                    <span
                      className={`block h-4 w-4 rounded-full border border-white/30 bg-white/10 ${
                        isPulling ? '' : 'transition-transform duration-200'
                      }`}
                      style={{
                        marginTop: `${knobBaseMarginTop}px`,
                        transform: `translateY(${pullStyles.knobTranslateY}px)`,
                      }}
                    />
                  </div>

                  {/* Lamp + glow */}
                  <div className="relative mx-auto mt-6 h-40 w-40">
                    {/* Glow */}
                    <div
                      className={
                        "absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 " +
                        "group-focus-within:opacity-100"
                      }
                    >
                      <div className="absolute inset-6 rounded-full bg-yellow-300/10 blur-2xl" />
                      <div className="absolute inset-10 rounded-full bg-yellow-200/10 blur-3xl" />
                    </div>

                    {/* Lamp body */}
                    <div className="absolute left-1/2 top-2 h-10 w-1 -translate-x-1/2 bg-white/15" />
                    <div
                      className={
                        "absolute left-1/2 top-10 h-24 w-20 -translate-x-1/2 rounded-full bg-slate-600/70 transition-all duration-200 " +
                        "group-focus-within:bg-yellow-300 group-focus-within:shadow-[0_0_40px_rgba(250,204,21,0.35)]"
                      }
                    />
                    <div className="absolute left-1/2 top-[118px] h-3 w-14 -translate-x-1/2 rounded-full bg-slate-700/70" />
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-bold text-white">Pull the lamp to sign in</h2>
                <p className="mt-1 text-sm text-slate-200">
                  Create an account first, then sign in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
