const sandboxSafeBuild = process.env.SANDBOX_SAFE_BUILD === "1";

const config = {
  plugins: sandboxSafeBuild ? [] : ["@tailwindcss/postcss"],
};

export default config;
