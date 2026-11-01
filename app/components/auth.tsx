"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, Lock } from "lucide-react";

type Mode = "login" | "signup";

const COPY = {
  login: {
    title: "Welcome back.",
    sub: "Sign in for a more personal fragrance journey.",
    cta: "Sign in",
    switchText: "New to iwahh?",
    switchLink: "Create an account",
    image: "https://iili.io/nwL32Fn.png",
    eyebrow: "A SCENT. A MEMORY. A PART OF YOU.",
    headline: "Wear Your Presence.",
    caption: "Your favourite compositions, all in one place.",
  },
  signup: {
    title: "Create an Account",
    sub: "Begin your personalized olfactory story.",
    cta: "Create account",
    switchText: "Already have an account?",
    switchLink: "Log in",
    image: "https://iili.io/nwL32Fn.png",
    eyebrow: "ARTISAN PERFUMERY REDEFINED.",
    headline: "Elegance, Captured.",
    caption: "Your favourite compositions, all in one place.",
  },
} as const;

const springTransition = {
  type: "spring",
  stiffness: 160,
  damping: 24,
  mass: 0.9,
} as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export default function Auth({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const isLogin = mode === "login";
  const c = COPY[mode];

  const rules = [
    { label: "Must be at least 8 characters", ok: password.length >= 8 },
    { label: "Must contain one special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];

  const toggle = () => {
    setPassword("");
    setShow(false);
    setErrorMessage("");
    setStatusMessage("");
    setMode(isLogin ? "signup" : "login");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!isLogin && !rules.every((r) => r.ok)) {
      setErrorMessage("Please meet both password requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        // TODO: Implement your custom sign-in logic here
        // e.g., await signIn({ email, password, rememberMe })
      } else {
        // TODO: Implement your custom sign-up logic here
        // e.g., await signUp({ email, password })
      }
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    setErrorMessage("");
    setStatusMessage("");
    setIsSubmitting(true);
    try {
      // TODO: Implement your custom Google OAuth logic here
      // e.g., await signInWithGoogle()
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    setErrorMessage("");
    setStatusMessage("");
    if (!email.trim()) {
      setErrorMessage("Enter your email address above to reset your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement your password reset logic here
      // e.g., await sendPasswordReset(email.trim())
      setStatusMessage("If an account exists for that email, a reset link has been sent.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles =
    "w-full rounded-xl border border-white/10 bg-[#1c1e1a]/90 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#c7a76d]/60 focus:bg-black/60 focus:ring-1 focus:ring-[#c7a76d]/40";

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#070707] px-4 font-sans selection:bg-[#c7a76d]/30 selection:text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-8 lg:gap-14">
          
          {/* FORM COLUMN */}
          <motion.div
            layout
            transition={springTransition}
            className={`flex w-full max-w-md flex-col items-center justify-center ${
              isLogin ? "lg:order-1" : "lg:order-2"
            }`}
          >
            <div className="w-full rounded-3xl border border-white/6 bg-gradient-to-b from-[#2a2d28] via-[#1a1c18] to-[#10110e] p-6 shadow-2xl shadow-black/90 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Title & Subtitle */}
                  <div>
                    <h1 className="font-serif text-2xl font-normal leading-tight tracking-tight text-[#f4efe8] sm:text-3xl md:text-[36px]">
                      {c.title}
                    </h1>
                    <p className="mt-1.5 text-xs text-white/50 sm:text-[13px]">{c.sub}</p>
                  </div>

                  {/* Form */}
                  <form onSubmit={onSubmit} className="mt-5 space-y-3.5 sm:space-y-4">
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-xs font-normal text-white/80">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage("");
                          setStatusMessage("");
                        }}
                        className={inputStyles}
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-xs font-normal text-white/80">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={show ? "text" : "password"}
                          required
                          autoComplete={isLogin ? "current-password" : "new-password"}
                          placeholder="Enter your password"
                          value={password}
                          minLength={isLogin ? undefined : 8}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMessage("");
                          }}
                          className={`${inputStyles} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShow((s) => !s)}
                          aria-label={show ? "Hide password" : "Show password"}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
                        >
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Password validation requirements */}
                      {!isLogin && (
                        <div className="mt-2 space-y-1 pl-0.5">
                          {rules.map((r) => (
                            <div
                              key={r.label}
                              className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${
                                r.ok ? "text-[#c7a76d]" : "text-white/40"
                              }`}
                            >
                              <Check
                                size={11}
                                className={r.ok ? "opacity-100 text-[#c7a76d]" : "opacity-30"}
                              />
                              {r.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remember me & Forgot Password */}
                    {isLogin && (
                      <div className="flex items-center justify-between text-[11px] sm:text-xs">
                        <label className="flex cursor-pointer items-center gap-2 text-white/60 hover:text-white/80">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-white/20 bg-black/40 accent-[#c7a76d]"
                          />
                          <span>Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={onForgotPassword}
                          disabled={isSubmitting}
                          className="text-[#c7a76d] transition-colors hover:text-[#d4b984] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {(errorMessage || statusMessage) && (
                      <p
                        role={errorMessage ? "alert" : "status"}
                        className={`text-xs ${errorMessage ? "text-red-300" : "text-[#c7a76d]"}`}
                      >
                        {errorMessage || statusMessage}
                      </p>
                    )}

                    {/* Submit Button */}
                    <div className="pt-1">
                      <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#c7a76d] py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-[#1e1b14] transition-all duration-200 hover:bg-[#d4b984]"
                      >
                        <span>{isSubmitting ? "Please wait..." : c.cta}</span>
                        <ArrowRight
                          size={14}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </motion.button>
                    </div>

                    {/* Divider */}
                    <p className="text-center text-[11px] text-white/40">Or continue with</p>

                    {/* Google OAuth Button */}
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="button"
                      onClick={onGoogleSignIn}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e3e3e2] py-2.5 sm:py-2.5 text-xs font-medium text-[#1d1d1d] transition-all duration-200 hover:bg-white"
                    >
                      <GoogleIcon />
                      <span>Google</span>
                    </motion.button>
                  </form>

                  {/* Mode switch */}
                  <div className="mt-5 border-t border-white/8 pt-3.5 text-center text-[11px] sm:text-xs text-white/50">
                    {c.switchText}{" "}
                    <button
                      type="button"
                      onClick={toggle}
                      disabled={isSubmitting}
                      className="font-medium text-[#c7a76d] transition-colors hover:text-[#d4b984] hover:underline"
                    >
                      {c.switchLink}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Security Info */}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <Lock size={11} className="text-white/45" /> Your details, kept personal.
            </p>
          </motion.div>

          {/* IMAGE CARD */}
          <motion.aside
            layout
            transition={springTransition}
            className={`relative hidden aspect-[4/5] max-h-[500px] w-full max-w-[400px] overflow-hidden rounded-[36px] shadow-2xl shadow-black/95 lg:block ${
              isLogin ? "lg:order-2" : "lg:order-1"
            }`}
          >
            {/* Background Image */}
            <AnimatePresence initial={false}>
              <motion.div
                key={c.image}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Image
                  src={c.image}
                  alt="Fragrance bottle visual"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Dark Linear Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Bottom Text Content */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                className="absolute inset-x-8 bottom-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#c7a76d]">
                  {c.eyebrow}
                </p>
                <h2 className="mt-2.5 font-serif text-3xl font-normal leading-tight tracking-tight text-white xl:text-[34px]">
                  {c.headline}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-white/65">{c.caption}</p>
              </motion.div>
            </AnimatePresence>
          </motion.aside>

        </div>
      </main>
    </MotionConfig>
  );
}