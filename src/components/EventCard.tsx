import { Calendar, MapPin, Users, Church, Cross } from "lucide-react";

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  icon: "users" | "map-pin" | "church" | "cross";
}

const ICONS = {
  users: Users,
  "map-pin": MapPin,
  church: Church,
  cross: Cross,
};

const EventCard = ({ title, date, location, icon }: EventCardProps) => {
  const Icon = ICONS[icon];
  return (
    <div className="bg-purple-dark/50 backdrop-blur-sm border border-gold/30 rounded-lg p-6 text-center shadow-lg">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold/80 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6 text-black" />
        </div>
        <h3 className="text-white font-semibold text-lg uppercase">{title}</h3>
      </div>
      <div className="space-y-1 text-gray-300 text-sm mt-4 font-tt-chocolates">
        <div className="flex items-center justify-center space-x-2">
          <Calendar className="w-4 h-4 text-gold" />
          <span>{date}</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <MapPin className="w-4 h-4 text-gold" />
          <span>{location}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
