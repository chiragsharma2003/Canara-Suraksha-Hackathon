'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { askChatbot } from '@/app/actions';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { id: 'initial', text: "Hello! I'm Canara-Bot. How can I help you with our products and services today?", sender: 'bot' }
            ]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponse = await askChatbot(input);
            const botMessage: Message = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = { id: (Date.now() + 1).toString(), text: "Sorry, I'm having trouble connecting. Please try again later.", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const BotIcon = () => (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
            <motion.circle 
                cx="50" cy="50" r="45" 
                className="fill-primary"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, yoyo: Infinity, ease: "easeInOut" }}
            />
            <path d="M25 60C25 55 40 50 50 50C60 50 75 55 75 60" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <motion.circle 
                cx="35" cy="40" r="7" fill="white" 
                animate={{ y: [-1, 1, -1] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} 
            />
            <motion.circle 
                cx="65" cy="40" r="7" fill="white"
                animate={{ y: [1, -1, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>
    );

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-[350px] h-[500px] mb-4"
                        >
                            <Card className="h-full w-full flex flex-col shadow-2xl">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bot className="w-6 h-6 text-primary" />
                                        <CardTitle className="text-xl">Canara-Bot</CardTitle>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-grow overflow-hidden p-0">
                                    <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                                        <div className="space-y-4">
                                            {messages.map(msg => (
                                                <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                                    {msg.sender === 'bot' && (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={18}/></AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className={cn(
                                                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                                        msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                                                    )}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))}
                                            {isLoading && (
                                                 <div className="flex items-end gap-2 justify-start">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={18}/></AvatarFallback>
                                                    </Avatar>
                                                    <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin"/>
                                                        <span className="text-sm">Thinking...</span>
                                                    </div>
                                                 </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                                <CardFooter>
                                    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                                        <Input
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Ask a question..."
                                            disabled={isLoading}
                                            autoComplete="off"
                                        />
                                        <Button type="submit" size="icon" disabled={isLoading}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex justify-end"
                >
                    <Button
                        onClick={() => setIsOpen(prev => !prev)}
                        className="rounded-full h-16 w-16 shadow-lg flex items-center justify-center"
                    >
                       {isOpen ? <X className="w-8 h-8"/> : <BotIcon />}
                    </Button>
                </motion.div>
            </div>
        </>
    );
}
