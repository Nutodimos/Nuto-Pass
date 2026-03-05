import Image from "next/image";

const MessagesPage = () => {
    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-CPENavy/10 rounded-full flex items-center justify-center mb-6">
                <Image src="/message.png" alt="Messages" width={48} height={48} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Messages</h1>
            <p className="text-slate-500 max-w-md">
                The messaging system is currently under development. Soon you&apos;ll be able to chat with teachers and students directly here.
            </p>
        </div>
    );
};

export default MessagesPage;
