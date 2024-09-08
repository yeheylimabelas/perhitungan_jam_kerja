function calculateAndDisplayResults() {
  // Retrieve input values
  const startDateInput = document.getElementById("startDate").value;
  const endDateInput = document.getElementById("endDate").value;

  // Check if both dates are provided
  if (!startDateInput || !endDateInput) {
    document.getElementById("resultTable").innerHTML = ""; // Clear the results if any date is missing
    return;
  }

  // Parse dates
  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    alert("Tanggal tidak valid. Pastikan formatnya benar.");
    return;
  }

  if (startDate >= endDate) {
    alert("Tanggal mulai harus lebih awal dari tanggal akhir.");
    return;
  }

  // Calculate differences
  const duration = endDate - startDate;
  const totalDays = Math.floor(duration / (1000 * 60 * 60 * 24));
  const totalSeconds = Math.floor(duration / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  // Calculate working days
  let workingDaysCount = 0;
  let date = new Date(startDate);
  while (date <= endDate) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      workingDaysCount++;
    }
    date.setDate(date.getDate() + 1);
  }

  // Calculate weeks
  const totalWeeks = Math.ceil(totalDays / 7);

  // Calculate working hours
  const workingHoursCount = workingDaysCount * 8; // 8 hours per day
  let workingHoursRealCount = workingDaysCount * 7.052173913; // 7.05 hours per day
  workingHoursRealCount = Math.round(workingHoursRealCount * 100) / 100; // Round to 2 decimal places

  // Format numbers
  const formatNumber = (number) => number.toLocaleString("id-ID");

  // Display results
  const resultTable = document.getElementById("resultTable");
  resultTable.innerHTML = `
        <tr><th class="result-label">Jumlah Semua Hari</th><td>${formatNumber(
          totalDays
        )} Hari</td></tr>
        <tr><th class="result-label">Jumlah Hari Kerja</th><td>${formatNumber(
          workingDaysCount
        )} Hari</td></tr>
        <tr><th class="result-label">Jumlah Minggu</th><td>${formatNumber(
          totalWeeks
        )} Minggu</td></tr>
        <tr><th class="result-label">Jumlah Semua Jam Hari</th><td>${formatNumber(
          totalHours
        )} Jam</td></tr>
        <tr><th class="result-label">Jumlah Jam Kerja</th><td>${formatNumber(
          workingHoursCount
        )} Jam</td></tr>
        <tr><th class="result-label">Jumlah Jam Kerja Asli</th><td>${workingHoursRealCount} Jam</td></tr>
        <tr><th class="result-label">Jumlah Menit</th><td>${formatNumber(
          totalMinutes
        )} Menit</td></tr>
        <tr><th class="result-label">Jumlah Detik</th><td>${formatNumber(
          totalSeconds
        )} Detik</td></tr>
    `;
}

// Attach event listeners to the input fields
document
  .getElementById("startDate")
  .addEventListener("change", calculateAndDisplayResults);
document
  .getElementById("endDate")
  .addEventListener("change", calculateAndDisplayResults);
