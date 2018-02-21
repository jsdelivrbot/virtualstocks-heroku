import { key } from "./util/firebase-key";
import { Orders, Order, OrderData } from "./util/orders";
import { StockChange } from "./util/stocks-watcher";
import * as admin from "firebase-admin";

admin.initializeApp({
	credential: admin.credential.cert(JSON.parse(key))
});

const db = admin.firestore();
const orders = new Orders();

orders.listen((order: Order, change: StockChange) => {
	console.log(`Stock Update: ${change}`);
	orders.removeOrder(order);
});

db.collection("orders").where("fulfilled", "==", false).onSnapshot(snapshot => {
	console.log("==== NEW SNAPSHOT ====");
	snapshot.docChanges.forEach(change => {
		const order = new Order(change.doc);
		if (change.type === "added") {
			orders.addOrder(order);
			console.log(`New order: ${order}`);
		}
		if (change.type === "modified") {
			orders.updateOrder(order);
			console.log(`Modified order: ${order}`);
		}
		if (change.type === "removed") {
			orders.removeOrder(order);
			console.log(`Removed order: ${order}`);
		}
	});
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log("Shutting down");
	process.exit(0);
}