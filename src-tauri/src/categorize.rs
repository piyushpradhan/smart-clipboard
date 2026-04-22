use once_cell::sync::Lazy;
use regex::Regex;

static RE_URL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^https?://[^\s]+$").unwrap()
});
static RE_EMAIL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$").unwrap()
});
static RE_PHONE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[+]?[\d\s\-().]{7,}$").unwrap()
});
static RE_HEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$").unwrap()
});
static RE_RGB: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^(rgb|rgba|hsl|hsla|oklch|oklab)\(").unwrap()
});
static RE_PATH_WIN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[A-Za-z]:[\\/]").unwrap()
});
static RE_PATH_UNIX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^(/|~/|\./|\.\./)[^\s]").unwrap()
});
static RE_NUMBER: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^-?\d+(\.\d+)?$").unwrap()
});
static RE_CODEY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(;|=>|fn |def |const |function |import |export |use |SELECT |<[a-zA-Z])").unwrap()
});

pub fn categorize(text: &str) -> &'static str {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return "text";
    }
    let single_line = !trimmed.contains('\n');

    if single_line {
        if RE_URL.is_match(trimmed) {
            return "url";
        }
        if RE_EMAIL.is_match(trimmed) {
            return "email";
        }
        if RE_HEX.is_match(trimmed) || RE_RGB.is_match(trimmed) {
            return "color";
        }
        if RE_PATH_WIN.is_match(trimmed) || RE_PATH_UNIX.is_match(trimmed) {
            return "path";
        }
        if RE_NUMBER.is_match(trimmed) {
            return "number";
        }
        if RE_PHONE.is_match(trimmed) {
            let digits = trimmed.chars().filter(|c| c.is_ascii_digit()).count();
            if digits >= 7 && digits <= 15 {
                return "phone";
            }
        }
    }

    // Code heuristic: many lines or code-like tokens.
    let lines = trimmed.lines().count();
    if lines >= 3 && RE_CODEY.is_match(trimmed) {
        return "code";
    }
    if single_line && RE_CODEY.is_match(trimmed) && trimmed.len() < 400 {
        return "code";
    }

    "text"
}

pub fn make_preview(text: &str) -> String {
    let trimmed = text.trim();
    let first_line = trimmed.lines().next().unwrap_or("").to_string();
    if first_line.chars().count() > 160 {
        first_line.chars().take(160).collect::<String>() + "…"
    } else {
        first_line
    }
}
