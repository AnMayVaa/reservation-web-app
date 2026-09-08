"use client";

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GasGuideModal({ isOpen, onClose }: GasGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl p-2 rounded-xl hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-500/10">
            ⛽
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Blockchain Gas Cost & Architecture Guide
            </h3>
            <p className="text-xs text-slate-400">
              Technical explanations for Teacher&apos;s evaluation questions
            </p>
          </div>
        </div>

        {/* Question 1 */}
        <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <span>1️⃣</span> การเช็ค/อ่านข้อมูลใน Blockchain เสียค่า Gas หรือไม่?
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>ตอบ: ไม่เสียค่า Gas (ฟรี 100%)</strong> เมื่อเป็นการอ่านข้อมูลจากภายนอก (Off-chain Read via <code className="text-emerald-300 font-mono">eth_call</code>) เช่น การเรียกฟังก์ชัน <code className="text-emerald-300 font-mono">view</code> หรือ <code className="text-emerald-300 font-mono">pure</code> อย่าง <code className="text-emerald-300 font-mono">getAllRooms()</code>, <code className="text-emerald-300 font-mono">getRoomDetails()</code>, <code className="text-emerald-300 font-mono">owner()</code>
          </p>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            💡 <strong>ทำไมถึงฟรี?</strong> โหนด (Ethereum RPC Node) จะจำลองการประมวลผลบน EVM ในเครื่องของตนเองแบบ Read-only โดย<strong>ไม่ต้องสร้าง Transaction, ไม่ต้องกระจายข้อมูล (Broadcast), และไม่ต้องขุดลงบล็อก</strong> จึงไม่มีค่าธรรมเนียม Gas แก่ผู้เรียก
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            📊 ตารางเปรียบเทียบ Read vs Write Operations
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-2xl overflow-hidden">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">ประเภทการทำงาน</th>
                  <th className="p-3">Method / Function</th>
                  <th className="p-3">ค่า Gas (ETH)</th>
                  <th className="p-3">บันทึกลงบล็อก?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="bg-slate-900/40">
                  <td className="p-3 font-semibold text-emerald-400">Read (eth_call)</td>
                  <td className="p-3 font-mono text-[11px]">getAllRooms()</td>
                  <td className="p-3 font-bold text-emerald-400">0 ETH (ฟรี)</td>
                  <td className="p-3 text-slate-500">❌ ไม่บันทึก</td>
                </tr>
                <tr className="bg-slate-900/40">
                  <td className="p-3 font-semibold text-emerald-400">Cryptographic Sign</td>
                  <td className="p-3 font-mono text-[11px]">signDoorChallenge()</td>
                  <td className="p-3 font-bold text-emerald-400">0 ETH (ฟรี)</td>
                  <td className="p-3 text-slate-500">❌ ไม่บันทึก</td>
                </tr>
                <tr className="bg-slate-950/40">
                  <td className="p-3 font-semibold text-amber-400">Write (SSTORE)</td>
                  <td className="p-3 font-mono text-[11px]">bookRoom(roomId, dates)</td>
                  <td className="p-3 text-amber-300">~120,000 Gas</td>
                  <td className="p-3 text-emerald-400">✅ บันทึก</td>
                </tr>
                <tr className="bg-slate-900/40">
                  <td className="p-3 font-semibold text-amber-400">Write (Payment)</td>
                  <td className="p-3 font-mono text-[11px]">payRemaining(roomId)</td>
                  <td className="p-3 text-amber-300">~48,000 Gas</td>
                  <td className="p-3 text-emerald-400">✅ บันทึก</td>
                </tr>
                <tr className="bg-slate-900/40">
                  <td className="p-3 font-semibold text-rose-400">Write (Legacy Staff)</td>
                  <td className="p-3 font-mono text-[11px]">confirmCheckIn()</td>
                  <td className="p-3 text-rose-300">~42,000 Gas</td>
                  <td className="p-3 text-emerald-400">✅ บันทึก</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Question 2 */}
        <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <span>2️⃣</span> ถ้าข้อมูลมีปริมาณมหาศาล (Big Data) จะยังฟรีอยู่ไหม? และแก้ปัญหาอย่างไร?
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            แม้ว่า <code className="text-amber-300 font-mono">eth_call</code> จะไม่คิดค่า Ether แต่ RPC Node มีข้อกำหนด <strong>Gas Execution Limit (เช่น 50M gas) และ Timeout (10-30 วินาที)</strong> หากเราวน Loop ดึงห้องนับหมื่นห้องในคำสั่งเดียว โหนดจะปฏิเสธการประมวลผล (Node Out-of-Gas / Timeout)
          </p>
          <div className="space-y-2 text-xs text-slate-300">
            <p className="font-semibold text-white">แนวทางการ Optimize ระดับโปรดักชัน:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong className="text-white">Events + Off-Chain Indexing (The Graph):</strong> แปลงข้อมูลประวัติการจองเป็น Smart Contract Event (<code className="font-mono text-emerald-300">event RoomBooked</code>) แล้วใช้ Indexer นำไปลงฐานข้อมูล GraphQL เพื่อให้ค้นหาได้เร็วกว่า 100 เท่าแบบฟรี
              </li>
              <li>
                <strong className="text-white">IPFS Metadata Storage:</strong> เก็บรูปภาพและคำอธิบายห้องบน Decentralized Storage (IPFS) แล้วเก็บเพียง URI/Hash สั้นๆ ไว้บน Blockchain เพื่อลดขนาด Storage
              </li>
              <li>
                <strong className="text-white">Pagination (แบ่งหน้า):</strong> ใช้ฟังก์ชันแบบ <code className="font-mono text-emerald-300">getRooms(uint256 offset, uint256 limit)</code> แทนการส่ง Array ทั้งหมด
              </li>
            </ul>
          </div>
        </div>

        {/* Question 3 */}
        <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
          <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <span>3️⃣</span> IoT Smart Lock ลดค่า Gas ได้อย่างไร?
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            ในระบบโรงแรมทั่วไป พนักงานต้องส่ง Transaction ยืนยันการ Check-in ขึ้น Blockchain ทุกครั้ง (เสียค่า Gas ครั้งละ ~42,000 Gas)
            แต่ในระบบ <strong>Self-Service Contactless IoT Lock</strong> ของเรา:
          </p>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-1">
            <p>✅ ผู้เข้าพักปลดล็อกประตูด้วย <strong>Digital Signature (EIP-191)</strong> ผ่าน MetaMask</p>
            <p>✅ กลอนประตูดึง Public Address ของห้องผ่าน <code className="font-mono">eth_call</code> (0 Gas)</p>
            <p>✅ ตรวจสอบความถูกต้องของลายเซ็นแบบ Off-chain ด้วย <code className="font-mono">ecrecover</code> (0 Gas)</p>
            <p className="font-bold text-emerald-400">🎉 ประหยัดค่า Gas ของโรงแรมได้ 100% ในขั้นตอนการเปิดประตูห้อง!</p>
          </div>
        </div>

        {/* Footer Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-2xl transition cursor-pointer"
        >
          รับทราบและปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
}
