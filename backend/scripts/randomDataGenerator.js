/**
 * Generates a random date of birth between 18 and 65 years ago.
 * @returns {Date} A Date object.
 */
function generateRandomDOB() {
    const today = new Date();
    const minAge = 18;
    const maxAge = 65;

    // Calculate the range for the year
    const minYear = today.getFullYear() - maxAge;
    const maxYear = today.getFullYear() - minAge;

    // Generate a random year, month, and day
    const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
    const month = Math.floor(Math.random() * 12); // 0-11
    const day = Math.floor(Math.random() * 28) + 1; // 1-28 for simplicity

    return new Date(year, month, day);
}

/**
 * Generates a specified number of user objects.
 * @param {number} count The number of users to generate.
 * @returns {Array<Object>} An array of generated user objects.
 */
function generateUsers(count) {
    const firstNames = ["James", "Robert", "John", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Mark", "Paul", "George", "Kevin", "Brian", "Laura", "Nicole", "Amy", "Angela", "Melissa"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];
    const middleNames = ["Allen", "Scott", "Edward", "Lee", "Lynn", "Marie", "Nicole", "Rose", "Andrew", "Michael", "Elizabeth", "James", "Anne", "Thomas", "George"];
    const cities = ["Houston", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "Indianapolis", "Detroit", "Memphis", "Boston", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno"];
    const states = ["TX", "PA", "CA", "TX", "CA", "TX", "FL", "TX", "OH", "NC", "IN", "MI", "TN", "MA", "MD", "WI", "NM", "AZ", "CA"];
    const zipCodes = ["77001", "19101", "92101", "78201", "95101", "78701", "32099", "76101", "43201", "28201", "46201", "48201", "38101", "02101", "21201", "53201", "87101", "85701", "93701"];
    const occupations = ["Software Developer", "Data Analyst", "Product Manager", "Marketing Specialist", "Sales Representative", "Financial Analyst", "Teacher", "Engineer", "Registered Nurse", "Accountant", "UX/UI Designer", "System Administrator", "Content Writer", "Consultant", "Civil Engineer", "Electrician", "Chef", "Attorney", "Physician", "Librarian"];
    const companies = ["Innovate Solutions", "Global Dynamics", "Creative Minds", "DataStream Analytics", "NextGen Tech", "CloudPath Inc", "HealthFirst", "EduCorp", "BuildRight", "LegalEase", "MarketForce", "FinPro Group"];
    const countries = ["USA"];

    const users = [];

    for (let i = 0; i < count; i++) {
        // Randomly select components
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const hasMiddleName = Math.random() < 0.7; // 70% chance of having a middle name
        const middleName = hasMiddleName ? middleNames[Math.floor(Math.random() * middleNames.length)] : undefined;
        const occupation = occupations[Math.floor(Math.random() * occupations.length)];
        const company = companies[Math.floor(Math.random() * companies.length)];
        const cityIndex = Math.floor(Math.random() * cities.length);
        const city = cities[cityIndex];
        const state = states[cityIndex];
        const zipCode = zipCodes[cityIndex];
        const country = countries[0];
        const isActive = Math.random() < 0.9; // 90% are active

        // Construct derived fields
        const nameParts = [firstName, hasMiddleName ? middleName : null, lastName].filter(Boolean);
        const emailBase = nameParts.join('.').toLowerCase().replace(/\s/g, '');
        const email = `${emailBase}@${company.toLowerCase().replace(/\s/g, '')}.com`;
        const phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`; // Simple 10-digit number
        const websiteBase = nameParts.join('').toLowerCase();
        const website = `https://${websiteBase}.${occupation.split(' ')[0].toLowerCase()}`;
        const dob = generateRandomDOB();

        // Create the user object
        const user = {
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            email: email,
            phone: phone,
            dob: dob,
            address: `${Math.floor(Math.random() * 999) + 1} Random St`,
            city: city,
            state: state,
            zipCode: zipCode,
            country: country,
            occupation: occupation,
            company: company,
            website: website,
            bio: `Experienced ${occupation.toLowerCase()} working at ${company}, based in ${city}.`,
            isActive: isActive
        };

        users.push(user);
    }

    return users;
}

const generatedUsers = generateUsers(1000);
fs