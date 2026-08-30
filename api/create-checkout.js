export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        error: "Cart is empty",
      });
    }

    const lineItems = cart.map((item) => ({
      amount: item.price * 100,
      currency: "PHP",
      name: item.name,
      quantity: item.quantity,
    }));

    const auth = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString(
      "base64",
    );

    const response = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",

        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          data: {
            attributes: {
              line_items: lineItems,

              payment_method_types: ["card", "gcash", "paymaya"],

              success_url:
                "https://raymondwebdeveloper.github.io/lovecroche-v2/success.html",

              cancel_url:
                "https://raymondwebdeveloper.github.io/lovecroche-v2/",

              description: "Love Croché handmade crochet bag order",

              send_email_receipt: true,
            },
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);

      return res.status(response.status).json({
        error: "PayMongo checkout failed",
        details: data,
      });
    }

    return res.status(200).json({
      checkoutUrl: data.data.attributes.checkout_url,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error",
    });
  }
}
