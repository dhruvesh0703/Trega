import { WidgetErrorBoundary } from '../../components/ErrorBoundary';
import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ShieldCheck, Users, ShoppingBag, AlertOctagon, Activity, LayoutDashboard, Truck, UserCheck, Search, ChevronRight } from 'lucide-react';
import { User, TransactionOrder, DisputeTicket, SetuKycRecord } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isGuest, setActiveModal } = useMarketplace();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'ORDERS' | 'DISPUTES'>('OVERVIEW');

  // We could fetch real-time data for all users here, but since this is an admin panel, we'll listen to the collections directly.
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<TransactionOrder[]>([]);
  const [allDisputes, setAllDisputes] = useState<DisputeTicket[]>([]);

  
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => sessionStorage.getItem('trega_admin_auth') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default credentials for the admin dashboard
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('trega_admin_auth', 'true');
      setIsAdminAuthorized(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('trega_admin_auth');
    setIsAdminAuthorized(false);
  };

  useEffect(() => {
    // Only subscribe if admin is authorized
    if (!isAdminAuthorized) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setAllUsers(snap.docs.map(d => d.data() as User));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      setAllOrders(snap.docs.map(d => d.data() as TransactionOrder));
    });
    const unsubDisputes = onSnapshot(collection(db, 'disputes'), (snap) => {
      setAllDisputes(snap.docs.map(d => d.data() as DisputeTicket));
    });

    return () => {
      unsubUsers();
      unsubOrders();
      unsubDisputes();
    };
  }, [isAdminAuthorized]);

  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <form onSubmit={handleAdminLogin} className="bg-white p-10 rounded-2xl shadow-xl max-w-sm w-full text-center border border-stone-200">
          <ShieldCheck className="w-16 h-16 text-brand-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-stone-900 mb-2">Trega Admin</h2>
          <p className="text-stone-500 text-sm mb-6">Enter admin credentials to proceed.</p>
          
          {loginError && <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">{loginError}</div>}
          
          <div className="space-y-4 text-left mb-8">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-brand-900/20"
          >
            Sign In to Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            Trega Admin
          </h1>
          <p className="text-xs text-stone-500 mt-1">Superuser Dashboard</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarLink icon={<LayoutDashboard />} label="Overview" active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} />
          <SidebarLink icon={<Users />} label="Users & KYC" active={activeTab === 'USERS'} onClick={() => setActiveTab('USERS')} />
          <SidebarLink icon={<ShoppingBag />} label="Orders & Delivery" active={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} />
          <SidebarLink icon={<AlertOctagon />} label="Disputes" active={activeTab === 'DISPUTES'} onClick={() => setActiveTab('DISPUTES')} />
        </nav>
        <div className="p-4 text-xs text-stone-600 text-center border-t border-stone-800">
          Trega Platform &copy; 2026
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-stone-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-stone-800">{activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}</h2>
          <div className="flex items-center gap-4">
             <div className="text-sm">
                <strong className="text-stone-900 text-lg">Welcome</strong>
             </div>
             <button onClick={handleAdminLogout} className="px-4 py-2 bg-stone-100 text-stone-700 text-sm font-semibold rounded-lg hover:bg-stone-200 transition-colors">Sign Out</button>
          </div>
        </header>

        <div className="p-8">
          <WidgetErrorBoundary>
            {activeTab === 'OVERVIEW' && <OverviewTab users={allUsers} orders={allOrders} disputes={allDisputes} />}
            {activeTab === 'USERS' && <UsersTab users={allUsers} />}
            {activeTab === 'ORDERS' && <OrdersTab orders={allOrders} users={allUsers} />}
            {activeTab === 'DISPUTES' && <DisputesTab disputes={allDisputes} orders={allOrders} users={allUsers} />}
          </WidgetErrorBoundary>
        </div>
      </main>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-stone-800 hover:text-white'}`}
  >
    <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
    {label}
  </button>
);

const OverviewTab = ({ users, orders, disputes }: any) => {
  const pendingOrders = orders.filter((o: any) => o.deliveryStatus === 'ORDER_PLACED' || o.deliveryStatus === 'PICKED_UP_FROM_SELLER').length;
  const activeDisputes = disputes.filter((d: any) => d.status === 'DISPUTE_OPEN' || d.status === 'UNDER_REVIEW').length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <StatCard title="Total Users" value={users.length} icon={<Users className="w-6 h-6" />} color="text-blue-600" bg="bg-blue-50" />
       <StatCard title="Total Orders" value={orders.length} icon={<ShoppingBag className="w-6 h-6" />} color="text-green-600" bg="bg-green-50" />
       <StatCard title="Pending Deliveries" value={pendingOrders} icon={<Truck className="w-6 h-6" />} color="text-amber-600" bg="bg-amber-50" />
       <StatCard title="Active Disputes" value={activeDisputes} icon={<AlertOctagon className="w-6 h-6" />} color="text-red-600" bg="bg-red-50" />
    </div>
  );
};

const StatCard = ({ title, value, icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
     <div>
       <p className="text-stone-500 text-sm font-semibold">{title}</p>
       <p className="text-3xl font-black text-stone-900 mt-1">{value}</p>
     </div>
     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
       {icon}
     </div>
  </div>
);

const UsersTab = ({ users }: { users: User[] }) => {
  const [filter, setFilter] = useState<'ALL' | 'KYC_DONE' | 'KYC_PENDING'>('ALL');
  
  const filteredUsers = users.filter(u => {
    if (filter === 'KYC_DONE') return u.isKycVerified;
    if (filter === 'KYC_PENDING') return !u.isKycVerified;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-stone-900">User Directory</h3>
        <select value={filter} onChange={e => setFilter(e.target.value as any)} className="px-4 py-2 border border-stone-300 rounded-lg text-sm bg-white font-semibold">
          <option value="ALL">All Users</option>
          <option value="KYC_DONE">KYC Verified Only</option>
          <option value="KYC_PENDING">KYC Pending / Unverified</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Phone / Email</th>
              <th className="px-6 py-4 font-semibold">Location</th>
              <th className="px-6 py-4 font-semibold">KYC Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-stone-200 object-cover" />
                    <div>
                      <div className="font-bold text-stone-900">{user.name} {user.isAdmin && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>}</div>
                      <div className="text-xs text-stone-500">ID: {user.id.slice(0,8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-stone-800">{user.phone}</div>
                  <div className="text-xs text-stone-500">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-stone-800">{user.collegeOrArea || 'Unknown'}</div>
                </td>
                <td className="px-6 py-4">
                  {user.isKycVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                      <UserCheck className="w-3.5 h-3.5" /> Verified ({user.kycProvider || 'AADHAAR'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-bold border border-stone-200">
                      Unverified
                    </span>
                  )}
                  {user.aadhaarNumberMasked && <div className="text-[10px] text-stone-500 mt-1 font-mono">{user.aadhaarNumberMasked}</div>}
                </td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => alert(`User Details:\nName: ${user.name}\nPhone: ${user.phone}\nEmail: ${user.email}\nLocation: ${user.collegeOrArea}\nKYC: ${user.isKycVerified ? "Verified" : "Pending"}`)} className="text-brand-600 hover:text-brand-800 font-semibold text-xs">View Details</button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrdersTab = ({ orders, users }: { orders: TransactionOrder[], users: User[] }) => {
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { deliveryStatus: newStatus });
      alert(`Order updated to ${newStatus}`);
    } catch(e) {
      console.error(e);
      alert('Error updating order');
    }
  };

  return (
        <div className="space-y-6">
       <h3 className="text-xl font-bold text-stone-900">Delivery & Order Logistics</h3>
       <div className="grid gap-4">
          {orders.map(order => {
             const seller = users.find(u => u.id === order.sellerId);
             
             return (
             <div key={order.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                   <div className="flex justify-between">
                     <div>
                       <h4 className="font-bold text-lg text-stone-900">Order #{order.id}</h4>
                       <p className="text-sm text-stone-500">Item: {order.listingTitle} • ₹{order.amount} (Payout: ₹{order.sellerPayout ? order.sellerPayout : Math.round(order.amount - 100 - (order.amount*0.02))})</p>
                     </div>
                     <span className={`px-3 py-1 text-xs font-bold rounded-full h-fit ${order.deliveryStatus === 'DELIVERED_AND_VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.deliveryStatus?.replace(/_/g, ' ') || 'ORDER PLACED'}
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <div>
                         <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Pickup (Seller)</p>
                         <p className="font-semibold text-stone-800 text-sm">{order.sellerName}</p>
                         <p className="text-xs text-stone-600 mt-0.5">{seller?.collegeOrArea || 'Seller Location'}</p>
                         <p className="text-xs text-stone-500 mt-0.5">{seller?.phone || 'No phone'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Drop-off (Buyer)</p>
                         <p className="font-semibold text-stone-800 text-sm">{order.buyerName}</p>
                         <p className="text-xs text-stone-600 mt-0.5">{order.deliveryAddress} ({order.deliveryHostelOrRoom})</p>
                         <p className="text-xs text-stone-500 mt-0.5">{order.deliveryContactPhone}</p>
                      </div>
                   </div>
                </div>
                
                <div className="md:w-64 bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                   <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Logistics Actions</p>
                   <select 
                     value={order.deliveryStatus || 'ORDER_PLACED'}
                     onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                     className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-semibold"
                   >
                     <option value="ORDER_PLACED">Order Placed (Need Pickup)</option>
                     <option value="PICKED_UP_FROM_SELLER">Picked up from Seller</option>
                     <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                     <option value="DELIVERED_AND_VERIFIED">Delivered successfully</option>
                   </select>
                   <button onClick={() => { const buyerPhone = users.find(u => u.id === order?.buyerId)?.phone || order?.deliveryContactPhone || 'N/A'; const sellerPhone = seller?.phone || 'N/A'; const text = `Pickup: ${order.sellerName} (${seller?.collegeOrArea || 'Unknown'})\nSeller Phone: ${sellerPhone}\n\nDrop: ${order.buyerName} (${order.deliveryAddress}, ${order.deliveryHostelOrRoom})\nBuyer Phone: ${buyerPhone}`; navigator.clipboard.writeText(text); alert('Delivery details copied to clipboard!'); }} className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors">Copy Delivery Details (Porter/Dunzo)</button>
                </div>
             </div>
          )})}
          {orders.length === 0 && <p className="text-stone-500">No orders placed yet.</p>}
       </div>
    </div>
  );
}

const DisputesTab = ({ disputes, orders, users }: { disputes: DisputeTicket[], orders: TransactionOrder[], users: User[] }) => {
  return (
        <div className="space-y-6">
       <h3 className="text-xl font-bold text-stone-900">Dispute Management</h3>
       <div className="grid gap-4">
          {disputes.map(dispute => {
             const order = orders.find(o => o.id === dispute.orderId);
             const seller = users.find(u => u.id === order?.sellerId);
             const buyer = users.find(u => u.id === order?.buyerId);
             const buyerPhone = buyer?.phone || order?.deliveryContactPhone || 'Not available';
             const sellerPhone = seller?.phone || 'Not available';
             
             return (
             <div key={dispute.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                   <div className="flex justify-between">
                     <div>
                       <h4 className="font-bold text-lg text-red-600 flex items-center gap-2">
                         <AlertOctagon className="w-5 h-5" />
                         Dispute #{dispute.id.slice(0, 8)}
                       </h4>
                       <p className="text-sm text-stone-600 mt-1">Order: {dispute.orderId} • Escrow: ₹{dispute.amount}</p>
                     </div>
                     <span className={`px-3 py-1 text-xs font-bold rounded-full h-fit ${dispute.status === 'DISPUTE_OPEN' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-700'}`}>
                        {dispute.status.replace(/_/g, ' ')}
                     </span>
                   </div>
                   
                   <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                      <p className="font-semibold text-stone-800 text-sm">Reason: {dispute.reason.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-stone-600 mt-2">{dispute.description}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-4">
                     <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                       <p className="text-[10px] uppercase font-bold text-stone-500 mb-1 tracking-wider">Buyer Details</p>
                       <p className="font-semibold text-stone-800 text-sm">{order?.buyerName || 'Unknown'}</p>
                       <p className="text-xs text-stone-600 font-mono mt-1">{buyerPhone}</p>
                     </div>
                     <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                       <p className="text-[10px] uppercase font-bold text-stone-500 mb-1 tracking-wider">Seller Details</p>
                       <p className="font-semibold text-stone-800 text-sm">{order?.sellerName || 'Unknown'}</p>
                       <p className="text-xs text-stone-600 font-mono mt-1">{sellerPhone}</p>
                     </div>
                   </div>
                </div>
                
                <div className="md:w-64 bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                   <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Admin Actions</p>
                   <button onClick={() => { if(buyerPhone !== 'Not available') { window.open('https://wa.me/91' + buyerPhone.replace(/\D/g, '')); } else { alert('Buyer phone not available'); } }} className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors">Message Buyer</button>
                   <button onClick={() => { if(sellerPhone !== 'Not available') { window.open('https://wa.me/91' + sellerPhone.replace(/\D/g, '')); } else { alert('Seller phone not available'); } }} className="w-full py-2 bg-white border border-stone-300 text-stone-800 rounded-lg text-xs font-bold hover:bg-stone-50 transition-colors">Message Seller</button>
                   <div className="pt-2 border-t border-stone-200">
                     <button onClick={async () => { 
    if(!confirm('Are you sure you want to approve this refund?')) return;
    try {
      await updateDoc(doc(db, 'disputes', dispute.id), { status: 'REFUND_APPROVED' });
      await updateDoc(doc(db, 'orders', dispute.orderId), { escrowStatus: 'REFUNDED' });
      alert('Refund Approved successfully');
    } catch (e) {
      alert('Error approving refund');
    }
  }} className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">Approve Refund</button>
                   </div>
                </div>
             </div>
          )})}
          {disputes.length === 0 && <p className="text-stone-500">No active disputes.</p>}
       </div>
    </div>
  );
}
