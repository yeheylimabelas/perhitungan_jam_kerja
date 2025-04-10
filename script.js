document.addEventListener("DOMContentLoaded", function () {
  // === GLOBAL VARIABLES ===
  let autoWeekendHolidays = [];
  let holidays = [];
  window.holidays = holidays;

  // === DOM ELEMENTS ===
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const startDateIcon = document.getElementById("startDateIcon");
  const endDateIcon = document.getElementById("endDateIcon");
  const holidayPicker = document.getElementById("holidayPicker");
  const calendarIcon = document.getElementById("calendarIcon");
  const holidayTagsContainer = document.getElementById("holidayTagsContainer");

  // === CONSTANTS ===
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

  // === UTIL FUNCTIONS ===
  function formatDateToReadable(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  }

  let fp;
  // === FLATPICKR SETUP ===
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

  // === TAG RENDER FUNCTION ===
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
    if (!fp) return; // ⛔ Kalau belum di-assign, jangan lanjut

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
        "badge",
        isAutoWeekend ? "bg-secondary" : "bg-danger",
        "m-1",
        "d-flex",
        "align-items-center",
        "cursor-pointer"
      );
      tag.innerText = formattedDate;

      if (!isAutoWeekend) {
        const closeIcon = document.createElement("span");
        closeIcon.classList.add("ms-2");
        closeIcon.innerHTML = "&times;";
        closeIcon.addEventListener("click", function (e) {
          e.stopPropagation();
          removeHolidayTag(dateStr);
        });

        // Klik seluruh tag juga bisa hapus
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

  // === CALCULATION FUNCTION ===
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
      if (day !== 0 && day !== 6) {
        workingDaysCount++;
      } else {
        totalHolidays++;
      }
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
    const workingHoursCount = workingDaysCount * 8;

    const totalWorkSeconds = Math.floor(workingHoursCount * 3600);
    const totalMinutes = Math.floor(totalWorkSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalAllHours = Math.floor(totalDays * 24);

    let workingHoursRealCount = workingDaysCount * 7.052173913;
    workingHoursRealCount = Math.round(workingHoursRealCount * 100) / 100;

    const formatNumber = (number) => number.toLocaleString("id-ID");

    const resultTable = document.getElementById("resultTable");
    resultTable.innerHTML = `
      <tr><th class="result-label">Jumlah Semua Hari</th><td>${formatNumber(
        totalDays
      )} Hari</td></tr>
      <tr><th class="result-label">Jumlah Hari Kerja</th><td>${formatNumber(
        workingDaysCount
      )} Hari</td></tr>
      <tr><th class="result-label" style="background-color: #f7b9b5;">Jumlah Hari Libur</th>
        <td style="background-color: #f7b9b5;">${formatNumber(
          totalHolidays
        )} Hari (Sabtu, Minggu, Hari Libur)</td></tr>
      <tr><th class="result-label">Jumlah Minggu</th>
        <td>${formatNumber(totalWeeks)} Minggu</td></tr>
      <tr><th class="result-label">Jumlah Semua Jam ${totalDays} Hari</th><td>${formatNumber(
      totalAllHours
    )} Jam</td></tr>
      <tr><th class="result-label">Jumlah Jam Kerja</th><td>${formatNumber(
        totalHours
      )} Jam</td></tr>
      <tr><th class="result-label bg-gray">Jumlah Jam Kerja Asli</th><td class="bg-gray">${workingHoursRealCount} Jam</td></tr>
    `;

    updateHolidayTags();
  }

  // INITIAL CALLS
  calculateAndDisplayResults();
  updateHolidayTags();
});
