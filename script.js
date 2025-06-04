document.addEventListener("DOMContentLoaded", function () {
  let autoWeekendHolidays = [];
  let holidays = [];
  window.holidays = holidays;

  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const startDateIcon = document.getElementById("startDateIcon");
  const endDateIcon = document.getElementById("endDateIcon");
  const holidayPicker = document.getElementById("holidayPicker");
  const calendarIcon = document.getElementById("calendarIcon");
  const holidayTagsContainer = document.getElementById("holidayTagsContainer");

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

  function formatDateToReadable(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  }

  let fp;
  function setupFlatpickr(inputElement, iconElement, defaultDate) {
    const fp = flatpickr(inputElement, {
      dateFormat: "Y-m-d",
      defaultDate: defaultDate,
      allowInput: false,
      clickOpens: true,
      onReady: function (selectedDates) {
        if (selectedDates.length > 0) {
          const selectedDate = selectedDates[0].toLocaleDateString("sv-SE");
          inputElement.value = formatDateToReadable(selectedDate);
          inputElement.setAttribute("data-value", selectedDate);
          calculateAndDisplayResults();
        }
      },
      onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
          const selectedDate = selectedDates[0].toLocaleDateString("sv-SE");
          inputElement.value = formatDateToReadable(selectedDate);
          inputElement.setAttribute("data-value", selectedDate);
          calculateAndDisplayResults();
        }
      },
    });

    iconElement.addEventListener("click", function () {
      fp.open();
    });

    return fp;
  }

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

  setupFlatpickr(startDateInput, startDateIcon, startDate);
  setupFlatpickr(endDateInput, endDateIcon, today);

  fp = flatpickr(holidayPicker, {
    mode: "multiple",
    dateFormat: "Y-m-d",
    allowInput: false,
    clickOpens: true,
    onChange: function (selectedDates) {
      holidays = selectedDates.map((date) => {
        const localISO = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        )
          .toISOString()
          .split("T")[0];
        return localISO;
      });
      holidays.sort();
      updateHolidayTags();
      calculateAndDisplayResults();
    },
  });

  calendarIcon.addEventListener("click", function () {
    fp.open();
  });

  updateHolidayTags();

  function getWeekendDates(start, end) {
    const weekends = [];
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day === 0 || day === 6) {
        const iso = current.toISOString().split("T")[0];
        weekends.push(iso);
      }
      current.setDate(current.getDate() + 1);
    }
    return weekends;
  }

  function updateHolidayTags() {
    if (!fp) return;
    holidayTagsContainer.innerHTML = "";
    const startInput = startDateInput.getAttribute("data-value");
    const endInput = endDateInput.getAttribute("data-value");
    autoWeekendHolidays = [];

    if (startInput && endInput) {
      const start = new Date(startInput);
      const end = new Date(endInput);
      autoWeekendHolidays = getWeekendDates(start, end);
    }

    const combinedDates = [...new Set([...autoWeekendHolidays, ...holidays])];
    combinedDates.sort();

    combinedDates.forEach((dateStr) => {
      const formattedDate = formatDateToReadable(dateStr);
      const isAutoWeekend = autoWeekendHolidays.includes(dateStr);

      const tag = document.createElement("span");
      tag.classList.add(
        "inline-flex",
        "items-center",
        "rounded-md",
        "px-3",
        "py-1",
        "text-sm",
        "text-white",
        "cursor-pointer",
        isAutoWeekend ? "bg-gray-500" : "bg-red-500",
        "ml-1",
        "mb-1"
      );
      tag.innerText = formattedDate;

      if (!isAutoWeekend) {
        const closeIcon = document.createElement("span");
        closeIcon.classList.add("ml-2", "text-white", "font-bold");
        closeIcon.innerHTML = "&times;";
        closeIcon.addEventListener("click", function (e) {
          e.stopPropagation();
          removeHolidayTag(dateStr);
        });
        tag.addEventListener("click", function () {
          removeHolidayTag(dateStr);
        });
        tag.appendChild(closeIcon);
      }

      holidayTagsContainer.appendChild(tag);
    });

    const selected = combinedDates.map((str) => new Date(str));
    fp.setDate(selected, false);
    holidayPicker.value = "";
  }

  function removeHolidayTag(dateToRemove) {
    holidays = holidays.filter((date) => date !== dateToRemove);
    holidays.sort();
    fp.setDate(holidays, false);
    updateHolidayTags();
    calculateAndDisplayResults();
  }

  function calculateAndDisplayResults() {
    const startDateVal = startDateInput.getAttribute("data-value");
    const endDateVal = endDateInput.getAttribute("data-value");
    if (!startDateVal || !endDateVal) {
      document.getElementById("resultTable").innerHTML = "";
      return;
    }

    const startDate = new Date(startDateVal);
    const endDate = new Date(endDateVal);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert("Tanggal tidak valid. Pastikan formatnya benar.");
      return;
    }

    if (startDate >= endDate) {
      alert("Tanggal mulai harus lebih awal dari tanggal akhir.");
      return;
    }

    let workingDaysCount = 0;
    let totalHolidays = 0;
    let date = new Date(startDate);

    while (date <= endDate) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) workingDaysCount++;
      else totalHolidays++;
      date.setDate(date.getDate() + 1);
    }

    const holidayWorkdays = holidays.filter((holiday) => {
      const holidayDate = new Date(holiday);
      return (
        holidayDate >= startDate &&
        holidayDate <= endDate &&
        holidayDate.getDay() !== 0 &&
        holidayDate.getDay() !== 6
      );
    });

    const holidayCount = holidayWorkdays.length;
    workingDaysCount -= holidayCount;
    totalHolidays += holidayCount;

    const totalDays =
      Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const adjustedDuration = totalDays - holidayCount;
    const totalWeeks = Math.ceil(adjustedDuration / 7);
    const workingHoursCount = workingDaysCount * 9;

    const totalWorkSeconds = Math.floor(workingHoursCount * 3600);
    const totalMinutes = Math.floor(totalWorkSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalAllHours = Math.floor(totalDays * 24);

    let workingHoursRealCount = workingDaysCount * 7.052173913;
    workingHoursRealCount = Math.round(workingHoursRealCount * 100) / 100;

    const formatNumber = (number) => number.toLocaleString("id-ID");

    const resultTable = document.getElementById("resultTable");
    resultTable.innerHTML = `
    
      <tr><th class="text-left font-semibold px-2 py-1">Jumlah Minggu</th><td class="px-2 py-1">${formatNumber(
        totalWeeks
      )} Minggu</td></tr>

      <tr class="calc-row" data-formula="${totalDays} Hari × 24 Jam = ${totalAllHours} Jam">
        <th class="text-left font-semibold px-2 py-1">Jumlah Semua Hari</th>
        <td class="px-2 py-1">${formatNumber(totalDays)} Hari
          <i class="bi bi-calculator ml-2 text-gray-600 dark:text-orange-400"></i>
          <span class="ml-2 text-sm text-gray-600 dark:text-orange-400 hidden calc-text"></span>
        </td>
      </tr>

      <tr><th class="text-left font-semibold px-2 py-1 text-red-500">Jumlah Hari Libur</th><td class="px-2 py-1 text-red-500 font-semibold">${formatNumber(
        totalHolidays
      )} Hari (Sabtu, Minggu, Hari Libur)</td></tr>

      <tr class="calc-row" data-formula="${workingDaysCount} Hari × 9 Jam Kerja = ${totalHours} Jam">
        <th class="text-left font-semibold px-2 py-1">Jumlah Hari Kerja</th>
        <td class="px-2 py-1">
          ${formatNumber(workingDaysCount)} Hari
          <i class="bi bi-calculator ml-2 text-gray-600 dark:text-orange-400"></i>
          <span class="ml-2 text-sm text-gray-600 dark:text-orange-400 hidden calc-text"></span>
        </td>
      </tr>

      <tr class="calc-row" data-formula="${workingDaysCount} Hari × 7.052173913 Jam = ${workingHoursRealCount} Jam">
        <th class="text-left font-semibold px-2 py-1 text-green-500 dark:text-lime-400">Jumlah Jam Kerja Asli</th>
        <td class="px-2 py-1 font-semibold text-green-500 dark:text-lime-400 cursor-pointer">
          ${workingHoursRealCount} Jam
          <i class="bi bi-calculator ml-2 text-gray-600 dark:text-orange-400"></i>
          <span class="ml-2 text-sm text-gray-600 dark:text-orange-400 hidden calc-text"></span>
        </td>
      </tr>
    `;

    document.querySelectorAll(".calc-row").forEach((row) => {
      row.addEventListener("click", () => {
        const icon = row.querySelector("i");
        const formulaText = row.getAttribute("data-formula");
        const textSpan = row.querySelector(".calc-text");

        const isActive = icon.classList.contains("bi-calculator-fill");

        icon.classList.toggle("bi-calculator", isActive);
        icon.classList.toggle("bi-calculator-fill", !isActive);

        textSpan.textContent = isActive ? "" : formulaText;
        textSpan.classList.toggle("hidden", isActive);
      });
    });

    updateHolidayTags();
  }

  calculateAndDisplayResults();
  updateHolidayTags();
});
const toggleThemeBtn = document.getElementById("toggleThemeBtn");
let isDark = true;

if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener("click", function () {
    isDark = !isDark;
    const icon = toggleThemeBtn.querySelector("i");
    if (!icon) return;

    if (isDark) {
      icon.classList.remove("bi-brightness-high-fill");
      icon.classList.add("bi-moon-stars-fill");
    } else {
      icon.classList.remove("bi-moon-stars-fill");
      icon.classList.add("bi-brightness-high-fill");
    }
  });
}

const html = document.documentElement;
const themeIcon = document.getElementById("themeIcon");

function updateThemeUI() {
  if (html.classList.contains("dark")) {
    toggleThemeBtn.classList.remove("bg-yellow-500");
    toggleThemeBtn.classList.add("dark:bg-gray-700");
    themeIcon.className = "bi bi-moon-stars-fill";
  } else {
    toggleThemeBtn.classList.add("bg-yellow-500");
    toggleThemeBtn.classList.remove("dark:bg-gray-700");
    themeIcon.className = "bi bi-sun-fill";
  }
}

if (localStorage.getItem("theme") === "light") {
  html.classList.remove("dark");
} else {
  html.classList.add("dark");
}
updateThemeUI();

toggleThemeBtn.addEventListener("click", () => {
  html.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    html.classList.contains("dark") ? "dark" : "light"
  );
  updateThemeUI();
});
