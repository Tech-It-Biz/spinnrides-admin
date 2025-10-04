"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, Car, Users, TrendingUp, Plus, X, Edit2, Trash2, Eye, Search } from 'lucide-react';
import BookingsTimeline from "../../components/dashboard/BookingsTimeline";
import Image from 'next/image';

const CarRentalDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const tabs = ["overview", "cars", "bookings", "availability"];


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [carsRes, bookingsRes] = await Promise.all([
        fetch('/api/cars'),
        fetch('/api/bookings')
      ]);

      const bookingsData = await bookingsRes.json()
      const carsData = await carsRes.json()
      console.log(carsData)
      if (carsRes.ok) setCars(carsData.cars);
      if (bookingsRes.ok) setBookings(bookingsData.bookings);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCar = async (carData) => {
    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      });
      if (res.ok) {
        fetchData();
        setShowCarModal(false);
      }
    } catch (error) {
      console.error('Error creating car:', error);
    }
  };

  const handleUpdateCar = async (id, carData) => {
    try {
      const res = await fetch(`/api/cars/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      });
      if (res.ok) {
        fetchData();
        setShowCarModal(false);
        setSelectedCar(null);
      }
    } catch (error) {
      console.error('Error updating car:', error);
    }
  };

  const handleDeleteCar = async (id) => {
    if (!confirm('Are you sure you want to delete this car?')) return;
    try {
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  const handleUpdateBooking = async (id, data) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const stats = {
    totalCars: cars.length,
    totalBookings: bookings.length,
    activeBookings: bookings?.filter(b => b.status === 'CONFIRMED').length,
    revenue: bookings.reduce((sum, b) => sum + (b.payedAmount || 0), 0)
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === '' || 
      booking.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl  tracking-tight text-black">Car Rental Dashboard</h1>
        </div>
      </header>

      <nav className="border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 flex items-center">
          {/* Tabs (scrollable container) */}
          <div
            className="flex space-x-6 overflow-x-auto scrollbar-hide pb-2 scroll-smooth px-8 md:px-10 w-full"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-black text-black"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={Car} label="Total Cars" value={stats.totalCars} />
              <StatCard icon={Calendar} label="Total Bookings" value={stats.totalBookings} />
              <StatCard icon={Users} label="Active Bookings" value={stats.activeBookings} />
              <StatCard icon={TrendingUp} label="Revenue" value={`$${stats.revenue.toLocaleString()}`} />
            </div>
          </div>
        )}

        {activeTab === 'cars' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl text-center text-black w-full">Fleet Management</h2>
              <button
                onClick={() => {
                  setSelectedCar(null);
                  setShowCarModal(true);
                }}
                className="flex justify-center h-16 w-16 items-center rounded-3xl fixed right-4 bottom-4 space-x-2 bg-black text-white p-4 hover:bg-gray-800 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map(car => (
                <CarCard
                  key={car.id}
                  car={car}
                  onEdit={() => {
                    setSelectedCar(car);
                    setShowCarModal(true);
                  }}
                  onDelete={() => handleDeleteCar(car.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl text-black w-full text-center pb-8">All Bookings</h2>
            <div className="overflow-auto pb-4 items-center mb-8">
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute  left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-3xl border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-3xl border border-gray-300 focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onStatusChange={handleUpdateBooking}
                  onView={() => {
                    setSelectedBooking(booking);
                    setShowBookingModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {activeTab === 'availability' && (
          <BookingsTimeline cars={cars} bookings={bookings.filter(b => ['CONFIRMED','PENDING'].includes((b.status||'').toUpperCase()))} />
        )}
      </main>

      {showCarModal && (
        <CarModal
          car={selectedCar}
          onClose={() => {
            setShowCarModal(false);
            setSelectedCar(null);
          }}
          onSubmit={(data) => {
            if (selectedCar) {
              handleUpdateCar(selectedCar.id, data);
            } else {
              handleCreateCar(data);
            }
          }}
        />
      )}

      {showBookingModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBooking(null);
          }}
          onStatusChange={handleUpdateBooking}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{label}</p>
        <p className="text-3xl font-light text-black">{value}</p>
      </div>
      <Icon className="text-gray-400" size={32} />
    </div>
  </div>
);

const CarCard = ({ car, onEdit, onDelete }) => (
  <div className="border border-gray-200 group hover:border-black transition-colors">
    <div className="aspect-video bg-gray-100 overflow-hidden">
      {car.baseImage && (
        <img  src={car.baseImage} alt={car.model} className="w-full h-full object-cover" />
      )}
    </div>
    <div className="p-6">
      <h3 className="text-xl font-light text-black mb-2">{car.brand} {car.model}</h3>
      <p className="text-gray-500 text-sm mb-4">{car.year} • {car.transmission} • {car.fuel}</p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-light text-black">${car.amountPerDay}</span>
        <span className="text-gray-500 text-sm">/day</span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onEdit}
          className="flex-1 border border-gray-300 py-2 hover:border-black transition-colors"
        >
          <Edit2 size={16} className="inline mr-1" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 border border-gray-300 py-2 hover:border-red-500 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} className="inline mr-1" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

const BookingCard = ({ booking, onStatusChange, onView }) => {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  return (
    <div className="border border-gray-200 p-6 hover:border-black transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <h3 className="text-lg font-light text-black">
              {booking.car?.brand} {booking.car?.model}
            </h3>
            <span className={`px-3 py-1 text-xs ${statusColors[booking.status]}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-2">
            {booking.user?.name || 'Guest'} • {booking.user?.email || booking.user?.phoneNumber}
          </p>
          <p className="text-gray-500 text-sm">
            {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right mr-4">
            <p className="text-2xl font-light text-black">${booking.totalAmount}</p>
            <p className="text-gray-500 text-sm">Paid: ${booking.payedAmount}</p>
          </div>
          <button
            onClick={onView}
            className="border border-gray-300 p-2 hover:border-black transition-colors"
          >
            <Eye size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const CarModal = ({ car, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    brand: car?.brand || '',
    slug: car?.slug || '',
    model: car?.model || '',
    licensePlate: car?.licensePlate || '',
    baseImage: car?.baseImage || '',
    images: car?.images?.join(', ') || '',
    amountPerDay: car?.amountPerDay || '',
    carUses: car?.carUses || [],
    seats: car?.seats || '',
    transmission: car?.transmission || 'Automatic',
    fuel: car?.fuel || 'Petrol',
    year: car?.year || new Date().getFullYear(),
    luggage: car?.luggage || '',
    doors: car?.doors || ''
  });

  const carUses = ['ALL_USE', 'FAMILY', 'SAFARIS', 'ROAD_TRIPS', 'WEEKEND_PLANS', 'BUSINESS', 'OFF_ROAD', 'CITY_DRIVING', 'LUXURY', 'WEDDING', 'AIRPORT_TRANSFER'];

  const normalizeDriveLink = (url) => {
    if (!url) return url;
  
    // match Google Drive file link pattern
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  
    // if already in correct format or not a Drive link, return unchanged
    return url;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const data = {
      ...formData,
      // normalize baseImage
      baseImage: normalizeDriveLink(formData.baseImage.trim()),
  
      // normalize each image link
      images: formData.images
        .split(",")
        .map((s) => normalizeDriveLink(s.trim()))
        .filter(Boolean),
  
      amountPerDay: parseInt(formData.amountPerDay),
      seats: parseInt(formData.seats),
      year: parseInt(formData.year),
      luggage: parseInt(formData.luggage),
      doors: parseInt(formData.doors),
    };
  
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light text-black">{car ? 'Edit Car' : 'Add New Car'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-black">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="text"
                placeholder="Model"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="text"
                placeholder="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="text"
                placeholder="License Plate"
                value={formData.licensePlate}
                onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="number"
                placeholder="Price per Day"
                value={formData.amountPerDay}
                onChange={(e) => setFormData({...formData, amountPerDay: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="number"
                placeholder="Year"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="number"
                placeholder="Seats"
                value={formData.seats}
                onChange={(e) => setFormData({...formData, seats: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="number"
                placeholder="Doors"
                value={formData.doors}
                onChange={(e) => setFormData({...formData, doors: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <input
                type="number"
                placeholder="Luggage Capacity"
                value={formData.luggage}
                onChange={(e) => setFormData({...formData, luggage: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              />
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({...formData, transmission: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              >
                <option>Automatic</option>
                <option>Manual</option>
              </select>
              <select
                value={formData.fuel}
                onChange={(e) => setFormData({...formData, fuel: e.target.value})}
                className="border border-gray-300 px-4 py-3 focus:outline-none focus:border-black col-span-2"
              >
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Base Image URL"
              value={formData.baseImage}
              onChange={(e) => setFormData({...formData, baseImage: e.target.value})}
              className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
            />

            <textarea
              placeholder="Additional Images (comma-separated URLs)"
              value={formData.images}
              onChange={(e) => setFormData({...formData, images: e.target.value})}
              className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
              rows={3}
            />

            <div>
              <label className="block text-sm text-gray-600 mb-2">Car Uses</label>
              <div className="grid grid-cols-3 gap-2">
                {carUses.map(use => (
                  <label key={use} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.carUses.includes(use)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, carUses: [...formData.carUses, use]});
                        } else {
                          setFormData({...formData, carUses: formData.carUses.filter(u => u !== use)});
                        }
                      }}
                      className="border-gray-300"
                    />
                    <span>{use.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-black text-white py-3 hover:bg-gray-800 transition-colors"
              >
                {car ? 'Update Car' : 'Create Car'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 py-3 hover:border-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingDetailsModal = ({ booking, onClose, onStatusChange }) => {
  const [formData, setFormData] = useState({
    status: booking.status,
    payedAmount: booking.payedAmount || 0
  });
  
  const statusOptions = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onStatusChange(booking.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white scale-[0.7] max-w-2xl w-full">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light text-black">Booking Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-black">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-light text-black mb-4">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Vehicle</p>
                  <p className="text-black">{booking.car?.brand} {booking.car?.model}</p>
                </div>
                <div>
                  <p className="text-gray-500">License Plate</p>
                  <p className="text-black">{booking.car?.licensePlate}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-light text-black mb-4">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="text-black">{booking.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-black">{booking.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-black">{booking.user?.phoneNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-light text-black mb-4">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p className="text-black">{new Date(booking.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">End Date</p>
                  <p className="text-black">{new Date(booking.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="text-black">${booking.totalAmount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Balance Due</p>
                  <p className="text-black">${booking.totalAmount - formData.payedAmount}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-light text-black mb-4">Update Booking</h3>
              <div className="space-y-4 grid grid-cols-2 justify-between gap-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                <div className='!mt-0'>
                  <label className="block text-sm text-gray-500 mb-2">Paid Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    max={booking.totalAmount}
                    step="0.01"
                    value={formData.payedAmount}
                    onChange={(e) => setFormData({...formData, payedAmount: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-black text-white py-3 hover:bg-gray-800 transition-colors"
              >
                Update Booking
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 py-3 hover:border-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CarRentalDashboard;
