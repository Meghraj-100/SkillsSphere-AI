import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("skillssphere.theme") || "light";

    const isDark = savedTheme === "dark";

    setDarkMode(isDark);

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";

    setDarkMode(!darkMode);

    localStorage.setItem("skillssphere.theme", newTheme);

    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.documentElement.classList.toggle("light", newTheme === "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed top-4 right-4 z-50
        px-4 py-2 rounded-lg
        bg-[var(--surface)] text-[var(--text-main)]
        border border-[var(--border)]
        shadow-[var(--shadow-soft)]
        transition-all duration-300
        hover:bg-[var(--surface-hover)]
      "
    >
      {darkMode ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
};

export default ThemeToggle;