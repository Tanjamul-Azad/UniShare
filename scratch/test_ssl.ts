// @ts-ignore
import SSLCommerzPayment from "sslcommerz-lts";
import "dotenv/config";

const store_id = process.env.SSLCOMMERZ_STORE_ID || "testbox";
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || "qwerty";
const is_live = false;

const sslcz = new (SSLCommerzPayment as any)(store_id, store_passwd, is_live);

const data = {
    total_amount: 100,
    currency: 'BDT',
    tran_id: 'REF123',
    success_url: 'http://localhost:3000/success',
    fail_url: 'http://localhost:3000/fail',
    cancel_url: 'http://localhost:3000/cancel',
    shipping_method: 'No',
    product_name: 'Computer',
    product_category: 'Electronic',
    product_profile: 'general',
    cus_name: 'Customer Name',
    cus_email: 'cust@yahoo.com',
    cus_add1: 'Dhaka',
    cus_add2: 'Dhaka',
    cus_city: 'Dhaka',
    cus_state: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: '01711111111',
    cus_fax: '01711111111',
    ship_name: 'Customer Name',
    ship_add1: 'Dhaka',
    ship_add2: 'Dhaka',
    ship_city: 'Dhaka',
    ship_state: 'Dhaka',
    ship_postcode: '1000',
    ship_country: 'Bangladesh',
    multi_card_name: 'mastercard',
    value_a: 'ref001_A',
    value_b: 'ref002_B',
    value_c: 'ref003_C',
    value_d: 'ref004_D'
};

console.log("Initiating payment...");
sslcz.init(data).then((apiResponse: any) => {
    console.log("Response:", apiResponse);
    process.exit(0);
}).catch((err: any) => {
    console.error("Error:", err);
    process.exit(1);
});
