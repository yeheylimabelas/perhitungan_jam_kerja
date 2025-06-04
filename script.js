document.addEventListener("DOMContentLoaded", () => {
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

  let holidays = [];
  let autoWeekendHolidays = [];
  window.holidays = holidays;
  let fp;

  const formatDateReadable = (str) => {
    const date = new Date(str + "T00:00:00");
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${
      monthNames[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  const getWeekendDates = (start, end) => {
    const weekends = [];
    const date = new Date(start);
    while (date <= end) {
      if ([0, 6].includes(date.getDay())) {
        weekends.push(date.toISOString().split("T")[0]);
      }
      date.setDate(date.getDate() + 1);
    }
    return weekends;
  };

  const setupFlatpickr = (input, icon, defaultDate) => {
    const instance = flatpickr(input, {
      dateFormat: "Y-m-d",
      defaultDate,
      allowInput: false,
      onChange: (dates) => {
        if (dates.length) {
          const val = dates[0].toLocaleDateString("sv-SE");
          input.value = formatDateReadable(val);
          input.setAttribute("data-value", val);
          calculateResults();
        }
      },
      onReady: (dates) => {
        if (dates.length) {
          const val = dates[0].toLocaleDateString("sv-SE");
          input.value = formatDateReadable(val);
          input.setAttribute("data-value", val);
          calculateResults();
        }
      },
    });

    icon?.addEventListener("click", () => instance.open());
    return instance;
  };

  const updateHolidayTags = () => {
    holidayTagsContainer.innerHTML = "";

    const start = new Date(startDateInput.dataset.value);
    const end = new Date(endDateInput.dataset.value);
    autoWeekendHolidays = start && end ? getWeekendDates(start, end) : [];

    const allDates = [...new Set([...autoWeekendHolidays, ...holidays])].sort();

    allDates.forEach((date) => {
      const tag = document.createElement("span");
      const isAuto = autoWeekendHolidays.includes(date);

      tag.className = `inline-flex items-center rounded-md px-3 py-1 text-sm text-white cursor-pointer ${
        isAuto ? "bg-gray-500" : "bg-red-500"
      } ml-1 mb-1`;
      tag.textContent = formatDateReadable(date);

      if (!isAuto) {
        const close = document.createElement("span");
        close.innerHTML = "&times;";
        close.className = "ml-2 font-bold";
        close.addEventListener("click", (e) => {
          e.stopPropagation();
          removeHoliday(date);
        });
        tag.appendChild(close);
        tag.addEventListener("click", () => removeHoliday(date));
      }

      holidayTagsContainer.appendChild(tag);
    });

    const selected = allDates.map((d) => new Date(d));
    fp.setDate(selected, false);
    holidayPicker.value = "";
  };

  const removeHoliday = (date) => {
    holidays = holidays.filter((d) => d !== date);
    holidays.sort();
    fp.setDate(holidays, false);
    updateHolidayTags();
    calculateResults();
  };

  const calculateResults = () => {
    const startStr = startDateInput.dataset.value;
    const endStr = endDateInput.dataset.value;

    if (!startStr || !endStr) return (resultTable.innerHTML = "");

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (start >= end)
      return alert("Tanggal mulai harus lebih awal dari tanggal akhir.");

    let workingDays = 0,
      totalHolidays = 0,
      date = new Date(start);
    while (date <= end) {
      const isWeekend = [0, 6].includes(date.getDay());
      if (isWeekend) totalHolidays++;
      else workingDays++;
      date.setDate(date.getDate() + 1);
    }

    const extraHolidays = holidays.filter((h) => {
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
    const realWorkHours = Math.round(workingDays * 7.052173913 * 100) / 100;

    const num = (n) => n.toLocaleString("id-ID");

    resultTable.innerHTML = `
      <tr><th class="text-left font-semibold px-2 py-1">Jumlah Minggu</th><td class="px-2 py-1">${num(
        totalWeeks
      )} Minggu</td></tr>
      <tr class="calc-row" data-formula="${totalDays} Hari × 24 Jam = ${totalAllHours} Jam">
        <th class="text-left font-semibold px-2 py-1">Jumlah Semua Hari</th>
        <td class="px-2 py-1">${num(
          totalDays
        )} Hari <i class="bi bi-calculator ml-2 text-gray-600 dark:text-orange-400"></i><span class="ml-2 text-sm text-gray-600 dark:text-orange-400 hidden calc-text"></span></td>
      </tr>
      <tr><th class="text-left font-semibold px-2 py-1 text-red-500">Jumlah Hari Libur</th><td class="px-2 py-1 text-red-500 font-semibold">${num(
        totalHolidays
      )} Hari</td></tr>
      <tr class="calc-row" data-formula="${workingDays} Hari × 9 Jam = ${totalHours} Jam">
        <th class="text-left font-semibold px-2 py-1">Jumlah Hari Kerja</th>
        <td class="px-2 py-1">${num(
          workingDays
        )} Hari <i class="bi bi-calculator ml-2 text-gray-600 dark:text-orange-400"></i><span class="ml-2 text-sm text-gray-600 dark:text-orange-400 hidden calc-text"></span></td>
      </tr>
      <tr class="calc-row" data-formula="${workingDays} Hari × 7.052173913 Jam = ${realWorkHours} Jam">
        <th class="text-left font-semibold px-2 py-1 text-green-500 dark:text-lime-400">Jumlah Jam Kerja Asli</th>
        <td class="px-2 py-1 font-semibold text-green-500 dark:text-lime-400">${realWorkHours} Jam <i class="bi bi-calculator ml-2 text-gray-600 dark:text-orange-400"></i><span class="ml-2 text-sm text-gray-600 dark:text-orange-400 hidden calc-text"></span></td>
      </tr>
    `;

    document.querySelectorAll(".calc-row").forEach((row) => {
      row.addEventListener("click", () => {
        const icon = row.querySelector("i");
        const text = row.querySelector(".calc-text");
        const formula = row.dataset.formula;
        const isShown = icon.classList.contains("bi-calculator-fill");

        icon.classList.toggle("bi-calculator", isShown);
        icon.classList.toggle("bi-calculator-fill", !isShown);
        text.textContent = isShown ? "" : formula;
        text.classList.toggle("hidden", isShown);
      });
    });

    updateHolidayTags();
  };

  const toggleTheme = () => {
    html.classList.toggle("dark");
    const isDark = html.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeBtn.classList.toggle("bg-yellow-500", !isDark);
    themeBtn.classList.toggle("dark:bg-gray-700", isDark);
    themeIcon.className = isDark ? "bi bi-moon-stars-fill" : "bi bi-sun-fill";
  };

  themeBtn?.addEventListener("click", toggleTheme);

  (() => {
    const btn = themeBtn;
    let offsetX = 0,
      offsetY = 0,
      isDragging = false;

    const move = (x, y) => {
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
      btn.style.right = "auto";
      btn.style.bottom = "auto";
      btn.style.position = "fixed";
    };

    btn?.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - btn.getBoundingClientRect().left;
      offsetY = e.clientY - btn.getBoundingClientRect().top;
      btn.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) move(e.clientX - offsetX, e.clientY - offsetY);
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      btn.style.transition = "";
    });

    btn?.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.touches[0];
        offsetX = touch.clientX - btn.getBoundingClientRect().left;
        offsetY = touch.clientY - btn.getBoundingClientRect().top;
        btn.style.transition = "none";
      },
      { passive: false }
    );

    btn?.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        move(t.clientX - offsetX, t.clientY - offsetY);
        e.preventDefault();
      },
      { passive: false }
    );
  })();

  if (localStorage.getItem("theme") === "light") {
    html.classList.remove("dark");
  } else {
    html.classList.add("dark");
  }
  toggleTheme(); // sinkronisasi icon UI

  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  setupFlatpickr(startDateInput, startDateIcon, startMonth);
  setupFlatpickr(endDateInput, endDateIcon, today);

  fp = flatpickr(holidayPicker, {
    mode: "multiple",
    dateFormat: "Y-m-d",
    allowInput: false,
    clickOpens: true,
    onChange: (dates) => {
      holidays = dates.map(
        (d) =>
          new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0]
      );
      holidays.sort();
      updateHolidayTags();
      calculateResults();
    },
  });

  calendarIcon?.addEventListener("click", () => fp.open());

  calculateResults();
  updateHolidayTags();
});
