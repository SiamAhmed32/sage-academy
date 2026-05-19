import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlinePhone,
} from "react-icons/hi2";

export const homeContactContent = {
  badge: "সরাসরি যোগাযোগ",
  titleStart: "প্রশ্ন থাকলে আমাদের সাথে",
  titleAccent: "কথা বলুন",
  description:
    "ভর্তি, ব্যাচ, ক্লাস রুটিন বা সাধারণ যেকোনো তথ্যের জন্য খুব অল্প তথ্য দিয়ে বার্তা পাঠাতে পারবেন। আমাদের টিম দ্রুত যোগাযোগ করবে।",
  submitLabel: "বার্তা পাঠান",
  successMessage:
    "আপনার বার্তা সফলভাবে পাঠানো হয়েছে। আমরা দ্রুত যোগাযোগ করব।",
};

export const homeContactPoints = [
  {
    title: "দ্রুত উত্তর",
    description: "ফোন নম্বর দিলে আমাদের টিম প্রয়োজন অনুযায়ী যোগাযোগ করবে।",
    icon: HiOutlinePhone,
  },
  {
    title: "শিক্ষার্থী ও অভিভাবক",
    description: "ভর্তি থেকে সাধারণ তথ্য, দুই ধরনের প্রশ্নের জন্যই এই ফর্ম ব্যবহার করতে পারবেন।",
    icon: HiOutlineChatBubbleLeftRight,
  },
  {
    title: "সময় বাঁচে",
    description: "দীর্ঘ ফর্ম নয়, শুধু প্রয়োজনীয় তথ্য দিলেই শুরু করা যাবে।",
    icon: HiOutlineClock,
  },
];

export const homeContactMeta = [
  { label: "ফোন", value: "+880 1700-000000" },
  { label: "সময়", value: "সকাল ৯টা - রাত ৮টা" },
];
