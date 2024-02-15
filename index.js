const fs = require("fs");
const axios = require("axios");

// Function to make API call with rate limiting
async function makeApiCallWithRateLimit(doi) {
  try {
    const response = await axios.get(`https://api.crossref.org/works/${doi}`, {
      validateStatus: false, // Allow non-2xx status codes
    });

    const { data, headers } = response;
    const limit = parseInt(headers["x-rate-limit-limit"]);
    const interval = parseInt(headers["x-rate-limit-interval"]);

    console.log(`Rate limit: ${limit} requests per ${interval} seconds`);

    // Check if we need to wait based on rate limit
    if (limit && interval && limit > 0 && interval > 0) {
      const delay = Math.ceil((interval * 1000) / limit); // Convert interval to milliseconds
      console.log(`Delay between requests: ${delay} milliseconds`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return data;
  } catch (error) {
    console.error("Error fetching data from CrossRef API:", error.message);
    return null;
  }
}

// Function to format month
// Convert month number to month name
function formatMonth(month) {
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const monthNumber = parseInt(month);
  const monthName = monthNames[monthNumber - 1];
  return monthName;
}

// Function to format author names
function formatAuthors(authors) {
  // Split authors by 'and'
  const authorsArray = authors.split(" and ");

  // Format each author's name
  const formattedAuthors = authorsArray.map((author) => {
    const parts = author.trim().split(" ");
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(" ");
    const formattedName = `${lastName}, ${firstName}`;

    // Include middle initial if available
    if (parts.length > 2) {
      const middleInitial = parts[1][0];
      return `${formattedName} ${middleInitial}.`;
    }
    return formattedName;
  });

  return formattedAuthors.join(" and ");
}

// Function to convert Mendeley .bib format to Web of Science .bib format
async function convertToWOS(mendeleyBib) {
  let wosBib = "";

  // Splitting the Mendeley .bib content into individual entries
  const entries = mendeleyBib.split("@").slice(1);

  for (const entry of entries) {
    const entryType = entry.substring(0, entry.indexOf("{")).trim();
    const entryData = entry
      .substring(entry.indexOf("{") + 1, entry.lastIndexOf("}"))
      .trim(); // Adjusted entry data extraction

    // Base template for Web of Science .bib format
    let wosEntry = `@${entryType}{WOS:000000000000000, \n`;

    // Match fields and add them to the Web of Science entry if they exist
    const authorsMatch = entryData.match(/author\s*=\s*\{([^}]*)\}/);
    if (authorsMatch) {
      const formattedAuthors = formatAuthors(authorsMatch[1]);
      wosEntry += `author={${formattedAuthors}},\n`;
    }
    const titleMatch = entryData.match(/title\s*=\s*\{([^}]*)\}/);
    if (titleMatch) {
      wosEntry += `title={${titleMatch[1]}},\n`;
    }
    const yearMatch = entryData.match(/year\s*=\s*\{([^}]*)\}/);
    if (yearMatch) {
      wosEntry += `year={${yearMatch[1]}},\n`;
    }
    const pagesMatch = entryData.match(/pages\s*=\s*\{([^}]*)\}/);
    if (pagesMatch) {
      wosEntry += `pages={${pagesMatch[1]}},\n`;
    }
    const abstractMatch = entryData.match(/abstract\s*=\s*\{([^}]*)\}/);
    if (abstractMatch) {
      wosEntry += `abstract={${abstractMatch[1]}},\n`;
    }
    const journalMatch = entryData.match(/journal\s*=\s*\{([^}]*)\}/);
    if (journalMatch) {
      wosEntry += `journal={${journalMatch[1]}},\n`;
    }
    const volumeMatch = entryData.match(/volume\s*=\s*\{([^}]*)\}/);
    if (volumeMatch) {
      wosEntry += `volume={${volumeMatch[1]}},\n`;
    }
    const booktitleMatch = entryData.match(/booktitle\s*=\s*\{([^}]*)\}/);
    if (booktitleMatch) {
      wosEntry += `booktitle={${booktitleMatch[1]}},\n`;
    }

    const monthMatch = entryData.match(/month\s*=\s*\{([^}]*)\}/);
    if (monthMatch) {
      const formattedMonth = formatMonth(monthMatch[1]);
      wosEntry += `month={${formattedMonth}},\n`;
    }

    const doiMatch = entryData.match(/doi\s*=\s*\{([^}]*)\}/);
    if (doiMatch) {
      const doi = doiMatch[1];
      const data = await makeApiCallWithRateLimit(doi);
      if (data) {
        const isReferencedByCount = data?.message["is-referenced-by-count"];
        if (isReferencedByCount) {
          wosEntry += `times-cited={${isReferencedByCount}},\n`;
        }
        const referenceCount = data?.message["reference-count"];
        if (referenceCount) {
          wosEntry += `number-of-cited-references={${referenceCount}},\n`;
        }
        const documentType = data?.message.type;
        if (documentType) {
          wosEntry += `type={${documentType}},\n`;
        }
      }
      wosEntry += `doi={${doi}},\n`; // Include the DOI in the entry
    }

    wosEntry += "}\n\n";
    wosBib += wosEntry;
  }
  return wosBib;
}

const run = async () => {
  // Read Mendeley .bib file
  const mendeleyBib = fs.readFileSync("mendeley.bib", "utf-8");

  // Convert to Web of Science .bib format
  const convertedWosBib = await convertToWOS(mendeleyBib);

  // Write the converted data to another file
  fs.writeFileSync("wos_converted.bib", convertedWosBib, "utf-8");
};

run()
  .then(() => {
    console.log(
      "Conversion complete. Web of Science .bib file has been created.",
    );
  })
  .catch(console.error);
