const $ = (id) => document.getElementById(id);
let players = JSON.parse(localStorage.getItem("players") || "[]");
let scoreHistory = JSON.parse(localStorage.getItem("scoreHistory") || "[]");
let pending = null;
let timeout = null;
let randomTimeout = null;
let calcPlayerIndex = null;
let historyTimeout = null;
let pendingScoreChanges = [];

const save = () =>
    localStorage.setItem(
        "players",
        JSON.stringify(players.filter((p) => p.name.trim())),
    );

if (players.length === 0) {
    players = [
        { name: "Dương", score: 0 },
        { name: "Nghien", score: 0 },
        { name: "Minh", score: 0 },
        { name: "Thắng", score: 0 }
    ];
    save();
}

// Prevent double-tap zoom on mobile
let lastTouchEnd = 0;
document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

document.addEventListener("dblclick", (e) => {
    e.preventDefault();
});

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

const debouncedSave = debounce(save, 300);

const saveHistory = () => {
    localStorage.setItem("scoreHistory", JSON.stringify(scoreHistory));
};

const debouncedSaveHistory = debounce(saveHistory, 30000);

const addToHistory = (playerName, oldScore, newScore, change) => {
    const entry = {
        playerName: playerName || "Unnamed",
        oldScore,
        newScore,
        change,
        timestamp: Date.now()
    };
    pendingScoreChanges.push(entry);
    clearTimeout(historyTimeout);
    historyTimeout = setTimeout(() => {
        if (pendingScoreChanges.length > 0) {
            scoreHistory = scoreHistory.concat(pendingScoreChanges);
            pendingScoreChanges = [];
            saveHistory();
        }
    }, 30000);
};

const clearPending = () => {
    clearTimeout(timeout);
    document
        .querySelectorAll(".pending")
        .forEach((el) => el.classList.remove("pending"));
    pending = null;
};

const danger = (id, action) => {
    if (pending === id) {
        clearPending();
        action();
    } else {
        clearPending();
        document
            .querySelector(`[data-action="${id}"]`)
            ?.classList.add("pending");
        pending = id;
        timeout = setTimeout(clearPending, 1000);
    }
};

const getRank = (i) =>
    players.filter((p) => p.score > players[i].score).length + 1;

const getRankClass = (rank) =>
    rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";

const playerHTML = (p, i) => {
    const rank = getRank(i);
    const noname = p.name.trim() ? "" : " noname";
    const playerColor = getPlayerColor(p.name, i);
    return `<article id="p${i}" class="${noname}" style="background: ${playerColor}22; border-left: 4px solid ${playerColor}">
        <output class="${getRankClass(rank)}">${rank}</output>
        <input type="text" value="${p.name}" placeholder="Name" enterkeyhint="done" data-index="${i}" style="background: ${playerColor}11">
        <span>
            <button aria-label="Decrement score by one" data-score="-" data-index="${i}"><img src="./assets/icons/minus.svg"></button>
            <input type="text" inputmode="numeric" value="${p.score}" data-index="${i}" enterkeyhint="done" data-score-input style="background: ${playerColor}11">
            <button aria-label="Increment score by one" data-score="+" data-index="${i}"><img src="./assets/icons/plus.svg"></button>
        </span>
        <button aria-label="Calculate score" data-calc="${i}"><img src="./assets/icons/math-book.svg"></button>
        <button aria-label="Remove player (double click)" data-action="del${i}"><img src="./assets/icons/user-xmark.svg"></button>
    </article>`;
};

const updateButtons = () => {
    const named = players.filter((p) => p.name.trim()).length;
    const hasScores = players.some((p) => p.score !== 0);
    const hasHistory = scoreHistory.length > 0 || pendingScoreChanges.length > 0;
    const btns = [
        { el: $("random"), condition: named < 2 },
        { el: $("ranking"), condition: named < 2 },
        { el: $("add"), condition: players.length >= 100 },
        { el: $("reset-scores"), condition: !hasScores },
        { el: $("reset"), condition: players.length < 1 },
        { el: $("history"), condition: !hasHistory },
        { el: $("total"), condition: players.length < 1 },
    ];
    btns.forEach(({ el, condition }) => {
        if (!el) return;
        el.disabled = condition;
        el.classList.toggle("disabled", condition);
    });

    const total = calculateTotal();
    if ($("total-display")) {
        $("total-display").textContent = `Total: ${total} pts`;
    }

    const helpBtn = $("help");
    if (helpBtn) {
        if (players.length > 0) {
            helpBtn.style.visibility = "visible";
            setTimeout(() => (helpBtn.style.opacity = "1"), 10);
        } else {
            helpBtn.style.opacity = "0";
            setTimeout(() => (helpBtn.style.visibility = "hidden"), 200);
        }
    }
};

const updateNoname = (i) => {
    if (!players[i]) return;
    $("p" + i).classList.toggle("noname", !players[i].name.trim());
    updateButtons();
};

const updateRanks = () => {
    document.querySelectorAll("#list output").forEach((el, j) => {
        const rank = getRank(j);
        el.textContent = rank;
        el.className = getRankClass(rank);
    });
};

const updateScore = (i) => {
    if (!players[i]) return;
    const el = $("p" + i);
    if (!el) return;
    el.querySelector("[data-score-input]").value = players[i].score;
    updateRanks();
    updateButtons();
};

const render = () => {
    updateButtons();
    $("list").innerHTML = players.length
        ? players.map((p, i) => playerHTML(p, i)).join("")
        : `<aside class="fadeIn">
            <p>Score Tracker</p>
            <div class="info-item">
                <img src="./assets/icons/user-plus.svg" alt="" />
                <span>Add a new player</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/math-book.svg" alt="" />
                <span>Update score</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/user-xmark.svg" alt="" />
                <span>Remove player (double click)</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/restart.svg" alt="" />
                <span>Reset all scores (double click)</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/trash.svg" alt="" />
                <span>Delete all players (double click)</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/leaderboard.svg" alt="" />
                <span>Show current rankings</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/clock.svg" alt="" />
                <span>Show score history</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/sum.svg" alt="" />
                <span>Show total score</span>
            </div>
            <div class="info-item">
                <img src="./assets/icons/hexagon-dice.svg" alt="" />
                <span>Pick a random player</span>
            </div>
        </aside>`;
};

const add = () => {
    if (players.length >= 100) return;
    clearPending();
    const empty = $("list").querySelector("aside");
    if (empty) {
        empty.classList.add("fadeOut");
        setTimeout(() => empty.remove(), 200);
    }
    players.push({ name: "", score: 0 });
    updateButtons();
    const div = document.createElement("div");
    div.innerHTML = playerHTML(players[players.length - 1], players.length - 1);
    const newEl = div.firstElementChild;
    newEl.classList.add("fadeIn");
    $("list").appendChild(newEl);
    newEl.querySelector('input[type="text"]:not([data-score-input])').focus();
};

const del = (i) =>
    danger("del" + i, () => {
        const el = $("p" + i);
        el.classList.add("fadeOut");
        setTimeout(() => {
            players.splice(i, 1);
            save();
            render();
        }, 200);
    });

const resetScores = () => {
    const hasScores = players.some((p) => p.score !== 0);
    if (!hasScores) return;
    danger("reset-scores", () => {
        players.forEach((p) => (p.score = 0));
        save();
        players.forEach((_, i) => updateScore(i));
    });
};

const reset = () => {
    if (!players.length) return;
    danger("reset", () => {
        document
            .querySelectorAll("#list > article")
            .forEach((el) => el.classList.add("fadeOut"));
        setTimeout(() => {
            players = [];
            save();
            render();
        }, 200);
    });
};

const random = () => {
    const named = players
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.name.trim());
    if (named.length < 2) return;
    clearPending();
    clearTimeout(randomTimeout);
    document
        .querySelectorAll("#list > article")
        .forEach((el) => el.classList.remove("highlight"));
    const { i } = named[Math.floor(Math.random() * named.length)];
    const el = $("p" + i);
    el.classList.add("highlight");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    randomTimeout = setTimeout(() => el?.classList.remove("highlight"), 2000);
};

const buildRankingSnapshot = () => {
    const ranked = players
        .filter((p) => p.name.trim())
        .sort((a, b) => b.score - a.score);
    return ranked
        .map((p) => {
            const rank = ranked.filter((x) => x.score > p.score).length + 1;
            const cls = getRankClass(rank);
            return `<div class="ranking-row ${cls}">
            <span>${rank}. ${p.name}</span>
            <span>${p.score} pt.</span>
        </div>`;
        })
        .join("");
};

const openRanking = () => {
    $("ranking-content").innerHTML = buildRankingSnapshot();
    $("ranking-overlay").classList.add("show");
};

const closeRanking = () => $("ranking-overlay").classList.remove("show");
const openHelp = () => $("help-overlay").classList.add("show");
const closeHelp = () => $("help-overlay").classList.remove("show");

const getPlayerColor = (name, index = 0) => {
    const colors = [
        "#f87171", // red
        "#fb923c", // orange
        "#fbbf24", // amber
        "#a3e635", // lime
        "#4ade80", // green
        "#2dd4bf", // teal
        "#38bdf8", // sky
        "#818cf8", // indigo
        "#c084fc", // purple
        "#f472b6", // pink
        "#fb7185", // rose
        "#60a5fa", // blue
    ];
    if (!name || name.trim() === "") {
        return colors[index % colors.length];
    }
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const formatTimestamp = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
    if (diff < 604800000) return Math.floor(diff / 86400000) + "d ago";

    return date.toLocaleDateString();
};

const buildHistorySnapshot = () => {
    const allHistory = scoreHistory.concat(pendingScoreChanges);
    if (allHistory.length === 0) {
        return '<div class="history-empty">No score history yet</div>';
    }

    return allHistory
        .slice()
        .reverse()
        .map((entry) => {
            const sign = entry.change >= 0 ? "+" : "";
            const changeClass = entry.change >= 0 ? "positive" : "negative";
            const playerColor = getPlayerColor(entry.playerName);
            return `<div class="history-row" style="border-left: 4px solid ${playerColor}">
                <div class="history-row-top">
                    <span class="history-player" style="color: ${playerColor}">${entry.playerName}</span>
                    <span class="history-time">${formatTimestamp(entry.timestamp)}</span>
                </div>
                <div class="history-row-bottom">
                    <span class="history-current">${entry.newScore} pts</span>
                    <span class="history-change ${changeClass}">${sign}${entry.change}</span>
                </div>
            </div>`;
        })
        .join("");
};

const openHistory = () => {
    $("history-content").innerHTML = buildHistorySnapshot();
    $("history-overlay").classList.add("show");
};

const closeHistory = () => $("history-overlay").classList.remove("show");

const calculateTotal = () => {
    return players.reduce((sum, p) => sum + (parseInt(p.score) || 0), 0);
};

const buildTotalSnapshot = () => {
    const total = calculateTotal();
    if (players.length === 0) {
        return '<div class="total-empty">No players yet</div>';
    }

    const playerRows = players
        .map((p, i) => {
            const playerColor = getPlayerColor(p.name, i);
            return `<div class="total-row" style="border-left: 4px solid ${playerColor}">
                <span class="total-player" style="color: ${playerColor}">${p.name || "Unnamed"}</span>
                <span class="total-score">${p.score}</span>
            </div>`;
        })
        .join("");

    return `${playerRows}
        <div class="total-sum">
            <span>Total</span>
            <span class="total-sum-value">${total} pts</span>
        </div>`;
};

const openTotal = () => {
    $("total-content").innerHTML = buildTotalSnapshot();
    $("total-overlay").classList.add("show");
};

const closeTotal = () => $("total-overlay").classList.remove("show");

const safeEval = (expr) => {
    const sanitized = expr.replace(/\s+/g, "").replace(/[^0-9+\-*/().]/g, "");
    if (!sanitized) return null;

    const trimmed = sanitized.trim();
    if (/^[+\-*/]/.test(trimmed) && !/^[+\-]/.test(trimmed)) return null;

    let toEval = trimmed;
    if (/^\d/.test(toEval)) toEval = "+" + toEval;

    try {
        const result = Function('"use strict"; return (' + toEval + ")")();
        return typeof result === "number" && isFinite(result) ? result : null;
    } catch {
        return null;
    }
};

const openCalc = (i) => {
    calcPlayerIndex = i;
    $("calc-input").value = "";

    $("calc-player-name").textContent = players[i].name || "Unnamed Player";
    $("calc-actual-score").textContent = players[i].score + " pt.";

    $("calc-preview").textContent = "—";
    $("calc-preview").classList.remove("error");
    $("calc-overlay").classList.add("show");
    setTimeout(() => $("calc-input").focus(), 100);
};

const closeCalc = () => {
    $("calc-overlay").classList.remove("show");
    calcPlayerIndex = null;
};

const confirmCalc = () => {
    if (calcPlayerIndex === null) return;

    const input = $("calc-input");
    input.blur();

    const expr = input.value.trim();
    const sanitized = expr.replace(/\s+/g, "");

    let result;
    const currentScore = players[calcPlayerIndex].score;

    if (/^[*/]/.test(sanitized)) {
        try {
            result = Function(
                '"use strict"; return (' + currentScore + sanitized + ")",
            )();
        } catch {
            result = null;
        }
    } else {
        result = safeEval(expr);
        if (result !== null) {
            result = currentScore + result;
        }
    }

    if (result === null || !isFinite(result)) {
        $("calc-preview").classList.add("error");
        return;
    }

    const oldScore = currentScore;
    const newScore = Math.round(result);
    const change = newScore - oldScore;
    players[calcPlayerIndex].score = newScore;
    save();
    addToHistory(players[calcPlayerIndex].name, oldScore, newScore, change);
    updateScore(calcPlayerIndex);
    closeCalc();
};

document.addEventListener("DOMContentLoaded", render);

document.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) {
        if (!e.target.closest("[data-action]")) clearPending();
        return;
    }
    if (target.id === "random") random();
    else if (target.id === "add") add();
    else if (target.id === "reset-scores") resetScores();
    else if (target.id === "reset") reset();
    else if (target.dataset.action?.startsWith("del"))
        del(+target.dataset.action.replace("del", ""));
    else if (target.id === "ranking") openRanking();
    else if (target.id === "history") openHistory();
    else if (target.id === "total") openTotal();
    else if (target.id === "help") openHelp();
    else if (target.dataset.calc !== undefined) openCalc(+target.dataset.calc);
    else if (target.dataset.score) {
        const i = +target.dataset.index;
        const oldScore = players[i].score;
        const change = target.dataset.score === "+" ? 1 : -1;
        players[i].score += change;
        save();
        addToHistory(players[i].name, oldScore, players[i].score, change);
        updateScore(i);
    }
});

document.addEventListener("beforeinput", (e) => {
    if (
        e.target &&
        e.target.hasAttribute &&
        e.target.hasAttribute("data-score-input") &&
        e.target.dataset.index !== undefined
    ) {
        const data = e.data;
        if (!data) return;

        if (!/^[0-9\-]$/.test(data)) {
            e.preventDefault();
            return;
        }

        if (data === "-") {
            const currentValue = e.target.value;
            const cursorPos = e.target.selectionStart;

            if (currentValue.includes("-") || cursorPos !== 0) {
                e.preventDefault();
            }
        }
    }

    if (e.target.id === "calc-input") {
        const data = e.data;
        if (!data) return;

        if (!/^[0-9+\-*/().\s]$/.test(data)) {
            e.preventDefault();
        }
    }
});

document.addEventListener("input", (e) => {
    if (e.target.id === "calc-input") {
        const expr = e.target.value.trim();
        const preview = $("calc-preview");

        if (!expr) {
            preview.textContent = "—";
            preview.classList.remove("error");
            return;
        }

        const sanitized = expr.replace(/\s+/g, "");
        let result;
        const currentScore = players[calcPlayerIndex].score;

        if (/^[*/]/.test(sanitized)) {
            try {
                result = Function(
                    '"use strict"; return (' + currentScore + sanitized + ")",
                )();
            } catch {
                result = null;
            }
        } else {
            result = safeEval(expr);
            if (result !== null) {
                result = currentScore + result;
            }
        }

        if (result === null || !isFinite(result)) {
            preview.textContent = "Invalid expression";
            preview.classList.add("error");
        } else {
            const newScore = Math.round(result);
            const diff = newScore - currentScore;
            const sign = diff >= 0 ? "+" : "";
            preview.textContent = `${newScore} pt. (${sign}${diff})`;
            preview.classList.remove("error");
        }
        return;
    }

    const i = +e.target.dataset.index;
    if (!players[i]) return;

    if (
        e.target.type === "text" &&
        e.target.hasAttribute &&
        !e.target.hasAttribute("data-score-input")
    ) {
        players[i].name = e.target.value;
        debouncedSave();
        updateNoname(i);
    } else if (
        e.target.hasAttribute &&
        e.target.hasAttribute("data-score-input")
    ) {
        let value = e.target.value.trim();

        if (value === "" || value === "-") {
            return;
        }

        if (value.indexOf("-") > 0) {
            value = value.replace(/-/g, "");
        }

        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
            e.target.value = players[i].score;
            return;
        }

        const oldScore = players[i].score;
        const change = numValue - oldScore;
        players[i].score = numValue;
        e.target.value = numValue;
        debouncedSave();
        if (change !== 0) {
            addToHistory(players[i].name, oldScore, numValue, change);
        }
        updateRanks();
        updateButtons();
    }
});

document.addEventListener(
    "blur",
    (e) => {
        if (
            e.target.hasAttribute &&
            e.target.hasAttribute("data-score-input") &&
            e.target.dataset.index !== undefined
        ) {
            const i = +e.target.dataset.index;
            if (!players[i]) return;
            let value = e.target.value.trim();

            if (value === "" || value === "-") {
                players[i].score = 0;
                e.target.value = 0;
                save();
                updateRanks();
                updateButtons();
                return;
            }

            if (value.indexOf("-") > 0) {
                value = value.replace(/-/g, "");
            }

            const numValue = parseInt(value, 10);
            if (!isNaN(numValue)) {
                players[i].score = numValue;
                e.target.value = numValue;
                save();
                updateRanks();
                updateButtons();
            } else {
                players[i].score = 0;
                e.target.value = 0;
                save();
                updateRanks();
                updateButtons();
            }
        }
    },
    true,
);

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
        if (e.target.id === "calc-input") {
            confirmCalc();
        } else if (
            e.target.hasAttribute &&
            e.target.hasAttribute("data-score-input") &&
            e.target.dataset.index !== undefined
        ) {
            const i = +e.target.dataset.index;
            if (players[i]) {
                let value = e.target.value.trim();

                if (value === "" || value === "-") {
                    players[i].score = 0;
                    e.target.value = 0;
                } else {
                    if (value.indexOf("-") > 0) {
                        value = value.replace(/-/g, "");
                    }

                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
                        players[i].score = numValue;
                        e.target.value = numValue;
                    } else {
                        players[i].score = 0;
                        e.target.value = 0;
                    }
                }
                save();
                updateRanks();
            }
            e.target.blur();
        } else {
            e.target.blur();
        }
    }
    if (e.key === "Escape") {
        if ($("calc-overlay").classList.contains("show")) closeCalc();
        else if ($("ranking-overlay").classList.contains("show"))
            closeRanking();
        else if ($("help-overlay").classList.contains("show")) closeHelp();
        else if ($("history-overlay").classList.contains("show")) closeHistory();
        else if ($("total-overlay").classList.contains("show")) closeTotal();
    }
});

document.addEventListener(
    "focus",
    (e) => {
        if (e.target.hasAttribute && e.target.hasAttribute("data-score-input"))
            e.target.select();
    },
    true,
);

["visibilitychange", "beforeunload", "pagehide", "blur"].forEach((event) =>
    (event === "beforeunload" || event === "blur"
        ? window
        : document
    ).addEventListener(event, () => {
        save();
        if (pendingScoreChanges.length > 0) {
            scoreHistory = scoreHistory.concat(pendingScoreChanges);
            pendingScoreChanges = [];
            saveHistory();
        }
    }),
);

document.addEventListener("freeze", () => {
    save();
    if (pendingScoreChanges.length > 0) {
        scoreHistory = scoreHistory.concat(pendingScoreChanges);
        pendingScoreChanges = [];
        saveHistory();
    }
}, { capture: true });

$("ranking-close").addEventListener("click", closeRanking);
document
    .querySelector(".ranking-backdrop")
    .addEventListener("click", closeRanking);

$("calc-confirm").addEventListener("click", confirmCalc);
$("calc-cancel").addEventListener("click", closeCalc);
document.querySelector(".calc-backdrop").addEventListener("click", closeCalc);

document.querySelectorAll(".calc-keypad button").forEach(btn => {
    btn.addEventListener("click", () => {
        const input = $("calc-input");
        input.value += btn.dataset.calcKey;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
    });
});

$("help-close").addEventListener("click", closeHelp);
document.querySelector(".help-backdrop").addEventListener("click", closeHelp);

$("history-close").addEventListener("click", closeHistory);
document.querySelector(".history-backdrop").addEventListener("click", closeHistory);

$("total-close").addEventListener("click", closeTotal);
document.querySelector(".total-backdrop").addEventListener("click", closeTotal);

if ("serviceWorker" in navigator) {
    const basePath = window.location.pathname.replace(/\/[^/]*$/, "/");
    const swPath = basePath + "service-worker.js";
    navigator.serviceWorker.register(swPath);
}
