export const formatTimestamp = (dateFormat: string, timestamp: number): string => {
  const date = new Date(timestamp * 1000);

  // Define format tokens map
  const formatTokens: Record<string, string> = {
    'YYYY': date.getFullYear().toString(),
    'YY': date.getFullYear().toString().slice(2),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'M': String(date.getMonth() + 1),
    'DD': String(date.getDate()).padStart(2, '0'),
    'D': String(date.getDate()),
    'HH': String(date.getHours()).padStart(2, '0'),
    'H': String(date.getHours()),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'm': String(date.getMinutes()),
    'ss': String(date.getSeconds()).padStart(2, '0'),
    's': String(date.getSeconds()),
    'ddd': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
    'MMMM': ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'][date.getMonth()]
  };

  // Replace all tokens in the format string
  let formattedDate = dateFormat;
  for (const [token, value] of Object.entries(formatTokens)) {
    // Replace all occurrences of the token
    const tokenRegex = new RegExp(token, 'g');
    formattedDate = formattedDate.replace(tokenRegex, value);
  }

  return formattedDate;
}
