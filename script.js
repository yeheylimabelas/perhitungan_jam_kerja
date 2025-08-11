import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCxv4no-ygJdwxKyT0G__eNhHDeR8pcRAU",
  authDomain: "hari-libur-kerja.firebaseapp.com",
  projectId: "hari-libur-kerja",
  storageBucket: "hari-libur-kerja.appspot.com",
  messagingSenderId: "569635311380",
  appId: "1:569635311380:web:ece4b043617378aabdfc01",
};
initializeApp(firebaseConfig);
const db = getFirestore();

// Elements
const html = document.documentElement;
const themeBtn = document.getElementById("toggleThemeBtn");
const themeIcon = document.getElementById("themeIcon");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const startDateIcon = document.getElementById("startDateIcon");
const endDateIcon = document.getElementById("endDateIcon");
const holidayPicker = document.getElementById("holidayPicker");
const calendarIcon = document.getElementById("calendarIcon");
const holidayTagsContainer = document.getElementById("holidayTagsContainer");
const resultTable = document.getElementById("resultTable");

const holidaysManual = [];
const holidaysDB = [];
let autoWeekendHolidays = [];
let fp = null;
let showWeekend = false;
const holidaysDBMap = new Map();

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const dayNames = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const today = new Date();
const maxYear = today.getFullYear();
const maxDate = new Date(maxYear, 11, 31);

// === Utilities ===
const formatDateReadable = (str) => {
  const date = new Date(str + "T00:00:00");
  return `${dayNames[date.getDay()]}, ${date.getDate()} ${
    monthNames[date.getMonth()]
  } ${date.getFullYear()}`;
};

const getWeekendDates = (start, end) => {
  const weekends = [];
  const d = new Date(start);
  while (d <= end) {
    if ([0, 6].includes(d.getDay()))
      weekends.push(d.toLocaleDateString("sv-SE"));
    d.setDate(d.getDate() + 1);
  }
  return weekends;
};

const num = (n) => n.toLocaleString("id-ID");

// === Theme ===
const toggleTheme = () => {
  html.classList.toggle("dark");
  const isDark = html.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeBtn.classList.toggle("bg-yellow-500", !isDark);
  themeBtn.classList.toggle("dark:bg-gray-700", isDark);
  themeIcon.className = isDark ? "bi bi-moon-stars-fill" : "bi bi-sun-fill";
};

const setupDraggableButton = () => {
  let offsetX = 0,
    offsetY = 0,
    isDragging = false;
  themeBtn.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - themeBtn.getBoundingClientRect().left;
    offsetY = e.clientY - themeBtn.getBoundingClientRect().top;
    themeBtn.style.transition = "none";
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      themeBtn.style.left = `${e.clientX - offsetX}px`;
      themeBtn.style.top = `${e.clientY - offsetY}px`;
      themeBtn.style.position = "fixed";
    }
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    themeBtn.style.transition = "";
  });
};

// === Flatpickr Setup ===
const setupFlatpickr = (input, icon, defaultDate) => {
  const instance = flatpickr(input, {
    dateFormat: "Y-m-d",
    defaultDate,
    maxDate: maxDate,
    allowInput: false,
    onChange: (dates) => syncInput(input, dates),
    onReady: (dates) => syncInput(input, dates),
  });
  icon?.addEventListener("click", () => instance.open());
  return instance;
};

const syncInput = (input, dates) => {
  if (!dates.length) return;
  const val = dates[0].toLocaleDateString("sv-SE");
  input.value = formatDateReadable(val);
  input.setAttribute("data-value", val);
  calculateResults();
  subscribeToRealtimeHoliday();
};

// === Tag Libur
const updateHolidayTags = () => {
  if (!fp) return;
  holidayTagsContainer.innerHTML = "";

  const start = new Date(startDateInput.dataset.value);
  const end = new Date(endDateInput.dataset.value);
  autoWeekendHolidays = getWeekendDates(start, end);

  const allDates = [
    ...new Set([
      ...(showWeekend ? autoWeekendHolidays : []),
      ...holidaysDB,
      ...holidaysManual,
    ]),
  ].sort();

  allDates.forEach((date) => {
    const isAuto = autoWeekendHolidays.includes(date);
    const isDB = holidaysDB.includes(date);
    const isManual = !isAuto && !isDB && holidaysManual.includes(date);

    const tag = document.createElement("span");
    tag.className =
      "inline-flex items-center rounded-md px-3 py-1 text-sm text-white ml-1 mb-1 " +
      (isAuto ? "bg-gray-500" : isDB ? "bg-orange-500" : "bg-red-500");

    let showDesc = false;
    const labelBase = formatDateReadable(date);
    const description = holidaysDBMap.get(date);

    if (isDB && description) {
      tag.innerHTML = `${labelBase} <i class="bi bi-caret-right-fill ml-1 transition-all"></i>`;
    } else {
      tag.textContent = labelBase;
    }

    if (isDB && description) {
      tag.style.cursor = "pointer";
      tag.addEventListener("click", () => {
        showDesc = !showDesc;
        const iconClass = showDesc
          ? "bi bi-caret-left-fill ml-1 transition-all"
          : "bi bi-caret-right-fill ml-1 transition-all";

        tag.innerHTML = showDesc
          ? `${labelBase} <span class="font-bold italic">&nbsp(${description})</span> <i class="${iconClass}"></i>`
          : `${labelBase} <i class="${iconClass}"></i>`;
      });
    }

    if (isManual) {
      const close = document.createElement("span");
      close.innerHTML = "&times;";
      close.className = "ml-2 font-bold";
      tag.appendChild(close);

      // hanya manual yang bisa dihapus
      tag.style.cursor = "pointer";
      tag.addEventListener("click", () => removeHoliday(date));
    } else {
      tag.style.cursor = "default";
    }

    holidayTagsContainer.appendChild(tag);
  });

  fp.setDate(
    allDates.map((d) => new Date(d + "T12:00:00")),
    false
  );

  holidayPicker.value = "";
};

const removeHoliday = (date) => {
  const idx = holidaysManual.indexOf(date);
  if (idx !== -1) holidaysManual.splice(idx, 1);
  holidaysManual.sort();
  updateHolidayTags();
  calculateResults();
};

// === Hitung Jam Kerja
const calculateResults = () => {
  const startStr = startDateInput.dataset.value;
  const endStr = endDateInput.dataset.value;
  if (!startStr || !endStr) return (resultTable.innerHTML = "");

  const start = new Date(startStr);
  const end = new Date(endStr);
  if (start >= end)
    return alert("Tanggal mulai harus lebih awal dari tanggal akhir.");

  let workingDays = 0,
    totalHolidays = 0;
  const date = new Date(start);
  while (date <= end) {
    const isWeekend = [0, 6].includes(date.getDay());
    if (isWeekend) totalHolidays++;
    else workingDays++;
    date.setDate(date.getDate() + 1);
  }

  const allLibur = [...new Set([...holidaysDB, ...holidaysManual])];
  const extraHolidays = allLibur.filter((h) => {
    const d = new Date(h);
    return d >= start && d <= end && ![0, 6].includes(d.getDay());
  });

  workingDays -= extraHolidays.length;
  totalHolidays += extraHolidays.length;

  const totalDays = (end - start) / 86400000 + 1;
  const adjustedDuration = totalDays - extraHolidays.length;
  const totalWeeks = Math.ceil(adjustedDuration / 7);
  const totalHours = workingDays * 9;
  const totalAllHours = totalDays * 24;
  const totalAllHourHolidays = totalHolidays * 24;
  const realWorkHours = Math.round(workingDays * 7.05 * 100) / 100;

  const num = (n) => n.toLocaleString("id-ID");

  const colorJumlahHariLibur = "font-semibold text-red-500";
  const colorJumlahHariKerja =
    "font-semibold text-amber-500 dark:text-amber-300";
  const colorJumlahJamKerjaHarian =
    "font-semibold text-green-500 dark:text-lime-400";

  // === Tabel hasil utama ===
  resultTable.innerHTML = `
    <thead>
      <tr>
        <th class="text-left px-2 py-1">Label</th>
        <th class="text-left px-2 py-1">Nilai</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th class="text-left font-semibold px-2 py-1">Jumlah Minggu</th>
        <td class="px-2 py-1">${num(totalWeeks)} Minggu</td>
      </tr>
      <tr>
      <th class="text-left font-semibold px-2 py-1">Jumlah Keseluruhan Hari</th>
      <td class="px-2 py-1">${num(totalDays)} Hari</td>
      </tr>
      <tr>
        <th class="text-left px-2 py-1 ${colorJumlahHariLibur}">Jumlah Hari Libur</th>
        <td class="px-2 py-1 ${colorJumlahHariLibur}">${num(
    totalHolidays
  )} Hari</td>
      </tr>
      <tr>
        <th class="text-left px-2 py-1 ${colorJumlahHariKerja}"><i>Jumlah Hari Kerja</i></th>
        <td class="px-2 py-1 ${colorJumlahHariKerja}"><i>${num(
    workingDays
  )} Hari</i></td>
      </tr>
      <tr>
        <th class="text-left px-2 py-1 ${colorJumlahJamKerjaHarian}"><i>Jumlah Jam Kerja Harian</i></th>
        <td class="px-2 py-1 ${colorJumlahJamKerjaHarian}"><i>${realWorkHours} Jam</i></td>
      </tr>
    </tbody>
  `;

  // === Bagian "Cara Kalkulasi"
  const calcContainer = document.getElementById("calculationExplanation");
  const isCalcShown = document.getElementById("toggleCalculation")?.checked;

  if (isCalcShown) {
    calcContainer.innerHTML = `
      <div class="${colorJumlahJamKerjaHarian}">Jumlah Jam Kerja Harian → ${num(
      workingDays
    )} Hari × 7.05 Jam = ${realWorkHours} Jam</div>
      <div class="${colorJumlahHariKerja}">Jumlah Jam Kerja + Istirahat → ${num(
      workingDays
    )} Hari × 9 Jam = ${num(totalHours)} Jam</div>
      <div class="${colorJumlahHariLibur}">Jumlah Jam Libur → ${num(
      totalHolidays
    )} Hari × 24 Jam = ${num(totalAllHourHolidays)} Jam</div>
    <div>Jumlah Keseluruhan Jam → ${num(totalDays)} Hari × 24 Jam = ${num(
      totalAllHours
    )} Jam</div>
    `;
    calcContainer.classList.remove("hidden");
  } else {
    calcContainer.classList.add("hidden");
    calcContainer.innerHTML = "";
  }

  // === Warnai Flatpickr
  if (fp && typeof fp.set === "function") {
    fp.set("disable", [
      function (date) {
        const iso = date.toLocaleDateString("sv-SE");
        return autoWeekendHolidays.includes(iso) || holidaysDB.includes(iso);
      },
    ]);

    fp.set("onDayCreate", [
      function (dObj, dStr, fp, dayElem) {
        const date = dayElem.dateObj;
        const iso = date.toLocaleDateString("sv-SE");

        if (autoWeekendHolidays.includes(iso)) {
          dayElem.style.backgroundColor = "#6b7280"; // abu-abu
          dayElem.style.color = "white";
        } else if (holidaysDB.includes(iso)) {
          dayElem.style.backgroundColor = "#f97316"; // orange
          dayElem.style.color = "white";
        } else if (holidaysManual.includes(iso)) {
          dayElem.style.backgroundColor = "#ef4444"; // merah
          dayElem.style.color = "white";
        }
      },
    ]);
  }

  updateHolidayTags();
};

document.getElementById("toggleCalculation").addEventListener("change", () => {
  calculateResults();
});

// === Realtime Firestore
let unsubscribe = null;
const subscribeToRealtimeHoliday = () => {
  if (unsubscribe) unsubscribe();

  const startValue = startDateInput.dataset.value;
  const endValue = endDateInput.dataset.value;

  if (!startValue || !endValue) return;

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, "HolidayDate"),
    where("DateHoliday", ">=", start),
    where("DateHoliday", "<=", end)
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    holidaysDB.length = 0;
    holidaysDBMap.clear();

    snapshot.forEach((doc) => {
      const d = doc.data().DateHoliday.toDate();
      const dateStr = d.toLocaleDateString("sv-SE");
      const desc = doc.data().Description || "";
      holidaysDB.push(dateStr);
      holidaysDBMap.set(dateStr, desc);
    });
    updateHolidayTags();
    calculateResults();
  });
};

// === Init
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark" || !savedTheme) {
    html.classList.add("dark");
    themeIcon.className = "bi bi-moon-stars-fill";
    themeBtn.classList.add("dark:bg-gray-700");
    themeBtn.classList.remove("bg-yellow-500");
  } else {
    html.classList.remove("dark");
    themeIcon.className = "bi bi-sun-fill";
    themeBtn.classList.remove("dark:bg-gray-700");
    themeBtn.classList.add("bg-yellow-500");
  }

  themeBtn.addEventListener("click", toggleTheme);
  setupDraggableButton();

  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  setupFlatpickr(startDateInput, startDateIcon, startMonth);
  setupFlatpickr(endDateInput, endDateIcon, today);

  fp = flatpickr(holidayPicker, {
    mode: "multiple",
    dateFormat: "Y-m-d",
    allowInput: false,
    clickOpens: true,
    onChange: (dates, dateStr, instance) => {
      holidaysManual.length = 0;

      dates.forEach((d) => {
        const iso = d.toLocaleDateString("sv-SE");
        holidaysManual.push(iso);
      });

      holidaysManual.sort();
      updateHolidayTags();
      calculateResults();

      if (dates.length > 0) {
        instance.jumpToDate(dates[dates.length - 1]);
      }
    },
  });

  document.getElementById("toggleWeekend").addEventListener("change", (e) => {
    showWeekend = e.target.checked;
    updateHolidayTags();
  });

  calendarIcon?.addEventListener("click", () => fp.open());
  subscribeToRealtimeHoliday();
  updateHolidayTags();
});
