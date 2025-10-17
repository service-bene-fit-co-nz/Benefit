// Get the start of the week (Monday) for a given date
export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

export const normalizeDate = (date: Date): Date => {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
};

export const normalizeDateString = (date: string): Date => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const formatDate_DD_Mmm_YYYY = (
  dateString: string | Date | undefined | null
) => {
  if (!dateString) {
    return ""; // Or a default like "N/A" or "-"
  }

  let date: Date;
  if (typeof dateString === "string") {
    // Replace space with 'T' to make it a valid ISO 8601 string for robust parsing
    date = new Date(dateString.replace(" ", "T"));
  } else {
    date = dateString;
  }

  if (isNaN(date.getTime())) {
    return "Invalid-Date"; // Handle invalid date cases
  }

  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};
