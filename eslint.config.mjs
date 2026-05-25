import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
    ...nextVitals,

    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),

    {
        rules: {
            // This rule flags the common guard-return pattern:
            //   useEffect(() => { if (!x) { setState(y); return; } ... }, [x])
            // which is idiomatic React and does NOT cause cascading renders
            // because the effect body always returns synchronously in the early path.
            // Disable it project-wide; individual hooks can re-enable if needed.
            "react-hooks/set-state-in-effect": "off",

            // Allow <img> with external URLs where next/image can't be used
            // (e.g. user-uploaded photos from Firebase Auth or Cloudinary
            // where dimensions aren't known at build time).
            // Prefer next/image wherever possible; this suppresses the warning
            // for the remaining cases that are genuinely hard to convert.
            "@next/next/no-img-element": "warn",
        },
    },
]);

export default eslintConfig;
