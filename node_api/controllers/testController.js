import axios from "axios";

export const countriesFilters = async (req, res) => {
  try {
    const { data: countries } = await axios.get(
      "https://www.apicountries.com/countries",
      { timeout: 10000 } // safety timeout
    );

    const cleanedCountries = countries.map(country => ({
      name: country.name,
      alpha2Code: country.alpha2Code,
      alpha3Code: country.alpha3Code,
      callingCodes: country.callingCodes,
      timezones: country.timezones,
      flags: country.flags,
      currencies: country.currencies
    }));

    res.status(200).json([
       cleanedCountries
    ]);

  } catch (error) {
    console.error("countriesFilters error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch countries data"
    });
  }
};
