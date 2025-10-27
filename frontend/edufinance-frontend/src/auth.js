export const auth = {
  get() {
    try {
      return JSON.parse(localStorage.getItem("auth") || "{}");
    } catch {
      return {};
    }
  },
  set(data) {
    localStorage.setItem("auth", JSON.stringify(data || {}));
  },
  clear() {
    localStorage.removeItem("auth");
  }
};
