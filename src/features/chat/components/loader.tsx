import { motion } from 'framer-motion';
import { generateUUID } from '@/shared/utils';

export const Loader = () => {

    return (
        <motion.div
            data-testid="message-assistant-loading"
            className="w-full mx-auto max-w-4xl px-4 group/message min-h-96"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
        >
            <div
                className='flex gap-4  w-full  rounded-xl'
            >
                <div className="flex items-center justify-center gap-1">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={`thinking-dot-${generateUUID()}`}
                            className="h-3 w-3 rounded-full bg-theme-primary"
                            initial={{ x: 0 }}
                            animate={{
                                x: [0, 10, 0],
                                opacity: [0.5, 1, 0.5],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
